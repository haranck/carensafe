const crypto = require('crypto');
const orderRepository = require('../../../repositories/user/order.repository');
const paymentRepository = require('../../../repositories/user/payment.repository');
const webhookEventRepository = require('../../../repositories/user/processedWebhookEvent.repository');
const userRepository = require('../../../repositories/user/user.repository');
const orderService = require('../order/order.service');
const walletService = require('../wallet/wallet.service');
const razorpayUtil = require('../../../utils/razorpay');
const redisUtil = require('../../../utils/redis');
const { withTransaction } = require('../../../utils/transaction');
const env = require('../../../config/envValidation');
const { PENDING_PAYMENT_STATUS, UNPAID_CLOSED_STATUSES } = require('../../../config/orders');

const DUPLICATE_KEY_ERROR = 11000;
const RECONCILE_EVERY_MS = 20 * 1000;
const REFUND_MAX_TRIES = 5;
const PENDING_REFUND_CHECK_MS = 60 * 1000;
const REPLAY_WAIT_TRIES = 10;
const REPLAY_WAIT_MS = 500;
const ITEM_REFUND_KEY = /^refund:([a-f0-9]{24}):([a-f0-9]{24})$/;

const httpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const sameId = (a, b) => String(a) === String(b);
const rupees = (paise) => `₹${(paise / 100).toLocaleString('en-IN')}`;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const verificationFailed = () => httpError('Payment verification failed.', 400);

// Razorpay refund receipts are max 40 characters
const refundReceipt = (key) => `rf_${crypto.createHash('sha1').update(key).digest('hex').slice(0, 24)}`;

// A payment Razorpay holds money for (captured, or authorized → we capture it) that matches our Payment exactly;
// anything else on the Razorpay order is ignored here (verify / webhook record mismatches)
const paidAttempt = (payments, payment) => {
    const matching = payments.filter(
        (p) => p.order_id === payment.razorpayOrderId && p.amount === payment.amount && p.currency === payment.currency
    );
    return matching.find((p) => p.status === 'captured') || matching.find((p) => p.status === 'authorized');
};

/**
 * Razorpay payments: checkout for orders (online, wallet + online), wallet top-ups, verification, webhooks,
 * reconciliation, expiry and refunds to the original method. Money in integer PAISE.
 * Rules: Razorpay is never called inside a transaction; every money change happens in one transaction and is
 * idempotent (verify, webhook, reconcile and the jobs can all see the same payment, in any order).
 */
class PaymentService {
    // ── Checkout ────────────────────────────────────────────────────────────────────────────────────────

    async checkoutDetails(payment, userId, { description, address } = {}) {
        const user = await userRepository.findById(userId);
        return {
            keyId: razorpayUtil.keyId,
            mode: razorpayUtil.mode,
            orderId: payment.razorpayOrderId,
            amount: payment.amount,
            currency: payment.currency,
            name: 'Care N Safe',
            description,
            prefill: {
                name: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || address?.fullName || '',
                email: user?.email || '',
                contact: user?.phone || address?.phone || ''
            }
        };
    }

    async orderResponse(order, payment) {
        const view = orderService.toCustomerOrder(order);
        const paymentRequired = Boolean(payment) && order.orderStatus === PENDING_PAYMENT_STATUS;
        return {
            orderId: order._id,
            orderNumber: order.orderNumber,
            paymentRequired,
            order: view,
            razorpay: paymentRequired
                ? await this.checkoutDetails(payment, order.user, { description: `Order ${order.orderNumber}`, address: order.shippingAddress })
                : null
        };
    }

    /**
     * POST /orders. COD and wallet orders are final once created; online orders get a Razorpay order for the online
     * part after the order's transaction has committed. If Razorpay can't create it, the order is undone (stock back,
     * wallet part returned, 'payment_failed') and the request fails with 502. Same idempotencyKey → same response.
     */
    async checkout(userId, body) {
        const { order, isReplay } = await orderService.createCheckoutOrder(userId, body);

        if (order.paymentMethod !== 'razorpay') return this.orderResponse(order, null);
        if (order.orderStatus === 'payment_failed') {
            throw httpError("This checkout attempt couldn't start a payment. Please try again.", 409);
        }
        if (order.orderStatus !== PENDING_PAYMENT_STATUS) return this.orderResponse(order, null);

        let payment = await paymentRepository.findLatestByOrder(order._id);
        if (!payment && isReplay) {
            // The first request of this attempt is still creating the Razorpay order
            for (let i = 0; i < REPLAY_WAIT_TRIES && !payment; i++) {
                await wait(REPLAY_WAIT_MS);
                payment = await paymentRepository.findLatestByOrder(order._id);
            }
            if (!payment) throw httpError('Your payment is being prepared. Please try again in a moment.', 409);
        }
        if (!payment) payment = await this.startOrderPayment(order);

        const fresh = (await orderRepository.findById(order._id)) || order;
        return this.orderResponse(fresh, payment);
    }

    async startOrderPayment(order) {
        let razorpayOrder;
        try {
            razorpayOrder = await razorpayUtil.createOrder({
                amountPaise: order.payment.onlinePaise,
                receipt: order.orderNumber,
                notes: { purpose: 'order', orderId: String(order._id), userId: String(order.user) }
            });
        } catch (error) {
            await this.undoUnpaidOrder(order._id, 'payment_failed', 'The online payment could not be started');
            throw error;
        }

        try {
            return await withTransaction(async (session) => {
                const payment = await paymentRepository.create(
                    {
                        user: order.user,
                        purpose: 'order',
                        order: order._id,
                        amount: order.payment.onlinePaise,
                        currency: razorpayUtil.currency,
                        razorpayOrderId: razorpayOrder.id,
                        status: 'created',
                        mode: razorpayUtil.mode,
                        expiresAt: order.expiresAt
                    },
                    session
                );
                const current = await orderRepository.findById(order._id, session);
                const saved = await orderRepository.updateIfUnchanged(
                    current._id,
                    current.updatedAt,
                    { $set: { 'razorpay.orderId': razorpayOrder.id, paymentRef: payment._id } },
                    session
                );
                if (!saved) throw httpError('This order was just updated. Please try again.', 409);
                return payment;
            });
        } catch (error) {
            console.error('[Payments] saving the Razorpay order failed:', String(order._id), error.message);
            await this.undoUnpaidOrder(order._id, 'payment_failed', 'The online payment could not be started');
            throw httpError('Payment provider error, please try again.', 502);
        }
    }

    // Closes an unpaid order (stock back, wallet part returned). Safe to call twice: only a pending_payment order changes.
    async undoUnpaidOrder(orderId, status, note, { reason = 'payment_not_completed', by = 'system' } = {}) {
        try {
            return await withTransaction(async (session) => {
                const order = await orderRepository.findById(orderId, session);
                if (!order || order.orderStatus !== PENDING_PAYMENT_STATUS) return order;
                const saved = await orderService.releaseUnpaidOrder(order, { status, reason, note, by }, session);
                if (order.paymentRef) {
                    await paymentRepository.updateWhere(
                        { _id: order.paymentRef, status: { $in: ['created', 'attempted'] } },
                        { $set: { status: status === 'payment_expired' ? 'expired' : 'failed' } },
                        session
                    );
                }
                return saved;
            });
        } catch (error) {
            // The expiry job releases it later (expiresAt is set)
            console.error('[Payments] releasing an unpaid order failed:', String(orderId), error.message);
            return null;
        }
    }

    // POST /orders/:id/retry-payment: the same Razorpay order again, while the payment window is open
    async retryOrderPayment(userId, orderId) {
        let order = await orderRepository.findOwn(userId, orderId);
        if (!order) throw httpError('Order not found.', 404);

        if (order.orderStatus === PENDING_PAYMENT_STATUS) {
            await this.reconcileOrder(order, { force: true });
            order = await orderRepository.findOwn(userId, orderId);
        }
        if (order.orderStatus !== PENDING_PAYMENT_STATUS) {
            if (order.paymentStatus === 'paid') return this.orderResponse(order, null);
            throw httpError('This order can no longer be paid. Please place a new order.', 409);
        }
        if (!order.expiresAt || new Date(order.expiresAt) <= new Date()) {
            await this.expireOrder(order);
            throw httpError('The payment window for this order has closed. Please place a new order.', 410);
        }

        const payment = await paymentRepository.findLatestByOrder(order._id);
        if (!payment) throw httpError('Your payment is being prepared. Please try again in a moment.', 409);
        return this.orderResponse(order, payment);
    }

    // POST /wallet/topup (rupees): a Razorpay order whose captured payment credits the wallet
    async startWalletTopup(userId, amountRupees) {
        if (!Number.isInteger(amountRupees) || amountRupees < env.WALLET_TOPUP_MIN || amountRupees > env.WALLET_TOPUP_MAX) {
            throw httpError(`Add between ₹${env.WALLET_TOPUP_MIN} and ₹${env.WALLET_TOPUP_MAX}.`, 400);
        }
        const amountPaise = amountRupees * 100;
        const razorpayOrder = await razorpayUtil.createOrder({
            amountPaise,
            receipt: `topup_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
            notes: { purpose: 'wallet_topup', userId: String(userId) }
        });
        const payment = await paymentRepository.create({
            user: userId,
            purpose: 'wallet_topup',
            amount: amountPaise,
            currency: razorpayUtil.currency,
            razorpayOrderId: razorpayOrder.id,
            status: 'created',
            mode: razorpayUtil.mode,
            expiresAt: new Date(Date.now() + env.PAYMENT_EXPIRY_MINUTES * 60 * 1000)
        });
        return {
            paymentId: payment._id,
            razorpay: await this.checkoutDetails(payment, userId, { description: `Wallet top-up ${rupees(amountPaise)}` })
        };
    }

    // ── Verify / fail ───────────────────────────────────────────────────────────────────────────────────

    // POST /payments/verify: signature → Razorpay's own record (amount, currency, order) → capture → finalize
    async verifyPayment(userId, { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature }) {
        const payment = await paymentRepository.findByRazorpayOrderId(orderId);
        if (!payment || !sameId(payment.user, userId)) throw httpError('Payment not found.', 404);

        if (!razorpayUtil.verifyPaymentSignature({ orderId, paymentId, signature })) {
            await this.recordAttempt(payment._id, { paymentId, status: 'signature_mismatch' });
            console.warn('[Payments] signature mismatch for payment', String(payment._id));
            throw verificationFailed();
        }

        const razorpayPayment = await razorpayUtil.fetchPayment(paymentId);
        const outcome = await this.settle(payment, razorpayPayment);
        return this.outcomeView(outcome);
    }

    // POST /payments/failed (Razorpay popup's payment.failed): the attempt is recorded; the order stays payable
    async recordFailure(userId, { razorpay_order_id: orderId, error = {} }) {
        const payment = await paymentRepository.findByRazorpayOrderId(orderId);
        if (!payment || !sameId(payment.user, userId)) throw httpError('Payment not found.', 404);
        await this.recordAttempt(payment._id, {
            paymentId: error.metadata?.payment_id,
            status: 'failed',
            errorCode: error.code,
            errorDescription: error.description,
            errorReason: error.reason,
            errorSource: error.source,
            errorStep: error.step
        });
        return { recorded: true };
    }

    async recordAttempt(paymentId, attempt, session) {
        await paymentRepository.updateById(paymentId, { $push: { attempts: { ...attempt, at: new Date() } } }, session);
        await paymentRepository.updateWhere({ _id: paymentId, status: 'created' }, { $set: { status: 'attempted' } }, session);
    }

    /**
     * Checks Razorpay's payment against our Payment (same Razorpay order, exact amount, INR), captures it if only
     * authorized, then finalizes. Shared by verify, webhook, reconcile and the expiry job.
     */
    async settle(payment, razorpayPayment, { eventId, eventName } = {}) {
        if (
            razorpayPayment.order_id !== payment.razorpayOrderId ||
            razorpayPayment.amount !== payment.amount ||
            razorpayPayment.currency !== payment.currency
        ) {
            await this.recordAttempt(payment._id, {
                paymentId: razorpayPayment.id,
                status: 'mismatch',
                errorDescription: 'Order, amount or currency does not match'
            });
            console.error('[Payments] mismatching payment', razorpayPayment.id, 'for', String(payment._id));
            throw verificationFailed();
        }

        let current = razorpayPayment;
        if (current.status === 'authorized') {
            try {
                current = await razorpayUtil.capturePayment(current.id, payment.amount);
            } catch (error) {
                // Captured meanwhile (auto-capture / another request)?
                current = await razorpayUtil.fetchPayment(razorpayPayment.id);
                if (current.status !== 'captured') throw error;
            }
        }
        if (current.status === 'failed') {
            await this.recordAttempt(payment._id, {
                paymentId: current.id,
                status: 'failed',
                errorCode: current.error_code,
                errorDescription: current.error_description,
                errorReason: current.error_reason
            });
            throw httpError(current.error_description || 'Payment failed. Please try again.', 400);
        }
        if (current.status !== 'captured') throw httpError('Your payment is still being processed. Please check again shortly.', 409);

        return this.finalizePayment(payment, current, { eventId, eventName });
    }

    /**
     * Applies a captured payment, once, in ONE transaction (an already-applied payment returns 'already'):
     * - wallet top-up → wallet credited (key topup:<paymentId>)
     * - pending_payment order → confirmed + paid, bought quantities leave the cart
     * - order closed before the money came (expired / failed / cancelled) → restored if stock (and the wallet part) can
     *   be taken again; otherwise it stays cancelled ("out of stock after payment") and the payment is refunded in full
     * - a second payment on an already-settled order (two tabs) → refunded in full
     * eventId (webhooks) is recorded in the same transaction, so a redelivered event changes nothing.
     */
    async finalizePayment(paymentDoc, razorpayPayment, { eventId, eventName } = {}) {
        let outcome;
        try {
            outcome = await withTransaction(async (session) => {
                if (eventId) await webhookEventRepository.create(eventId, eventName || 'payment', session);
                const payment = await paymentRepository.findById(paymentDoc._id, session);
                const attempt = { paymentId: razorpayPayment.id, status: 'captured', method: razorpayPayment.method, at: new Date() };

                if (payment.razorpayPaymentId === razorpayPayment.id) return { type: 'already', payment };
                if (payment.razorpayPaymentId) {
                    await this.refundCapturedPayment(payment, razorpayPayment, 'Duplicate payment', `refund:duplicate:${razorpayPayment.id}`, session);
                    return { type: 'duplicate', payment };
                }

                const captured = await paymentRepository.updateWhere(
                    { _id: payment._id, razorpayPaymentId: { $exists: false } },
                    {
                        $set: { razorpayPaymentId: razorpayPayment.id, status: 'captured', method: razorpayPayment.method, capturedAt: new Date() },
                        $push: { attempts: attempt }
                    },
                    session
                );
                if (!captured) throw httpError('This payment was just updated. Please check again.', 409);

                if (payment.purpose === 'wallet_topup') {
                    const { transaction } = await walletService.credit(
                        {
                            userId: payment.user,
                            amountPaise: payment.amount,
                            source: 'topup',
                            description: `Wallet top-up${razorpayPayment.method ? ` (${razorpayPayment.method})` : ''}`,
                            idempotencyKey: `topup:${razorpayPayment.id}`
                        },
                        session
                    );
                    await paymentRepository.updateById(payment._id, { $set: { walletTransaction: transaction._id } }, session);
                    return { type: 'topup', payment: captured, balance: transaction.balanceAfter };
                }

                const order = await orderRepository.findById(payment.order, session);
                const details = { razorpayPaymentId: razorpayPayment.id, method: razorpayPayment.method };
                if (order.orderStatus === PENDING_PAYMENT_STATUS) {
                    return { type: 'order', order: await orderService.confirmPaidOrder(order, details, session) };
                }
                if (UNPAID_CLOSED_STATUSES.includes(order.orderStatus) && !order.razorpay?.paymentId && order.paymentStatus !== 'paid') {
                    const revived = await orderService.reviveUnpaidOrder(order, details, session);
                    if (revived) return { type: 'order', order: revived, revived: true };
                    return { type: 'order', order: await this.refundUnfulfillable(order, captured, razorpayPayment, session), refundedInFull: true };
                }
                // The order was settled by another payment meanwhile: give this money back
                await this.refundCapturedPayment(captured, razorpayPayment, 'Order already paid', `refund:duplicate:${razorpayPayment.id}`, session);
                return { type: 'duplicate', payment: captured, order };
            });
        } catch (error) {
            if (error.code === DUPLICATE_KEY_ERROR && error.keyPattern?.eventId) return { type: 'already', payment: paymentDoc };
            throw error;
        }
        this.kickRefunds();
        return outcome;
    }

    // Full refund of a captured payment we can't keep: to the wallet, or queued to the original method (REFUND_DESTINATION).
    // A duplicate (a payment other than the one this Payment settled with) is recorded without counting toward it.
    async refundCapturedPayment(payment, razorpayPayment, reason, key, session) {
        const isDuplicate = Boolean(payment.razorpayPaymentId) && payment.razorpayPaymentId !== razorpayPayment.id;
        const toSource = env.REFUND_DESTINATION === 'source';
        if (!toSource) {
            await walletService.credit(
                {
                    userId: payment.user,
                    amountPaise: razorpayPayment.amount,
                    source: 'refund',
                    orderId: payment.order,
                    description: `Refund: ${reason.toLowerCase()}`,
                    idempotencyKey: key
                },
                session
            );
        }
        await paymentRepository.updateById(
            payment._id,
            { $push: { attempts: { paymentId: razorpayPayment.id, status: 'refunded_in_full', method: razorpayPayment.method, errorDescription: reason, at: new Date() } } },
            session
        );
        await orderService.recordPaymentRefund(
            payment._id,
            {
                key,
                razorpayPaymentId: razorpayPayment.id,
                amount: razorpayPayment.amount,
                status: toSource ? 'queued' : 'processed',
                destination: toSource ? 'source' : 'wallet',
                reason,
                ...(!toSource && { processedAt: new Date() })
            },
            session,
            { countAmount: !isDuplicate }
        );
    }

    // Money arrived for an order that closed and can't be restored: it stays cancelled and the payment goes back in full
    async refundUnfulfillable(order, payment, razorpayPayment, session) {
        const key = `refund:${order._id}:after-close`;
        await this.refundCapturedPayment(payment, razorpayPayment, 'Out of stock after payment', key, session);
        const now = new Date();
        const where = env.REFUND_DESTINATION === 'source' ? 'to the original payment method (processing)' : 'to wallet';
        const saved = await orderRepository.updateIfUnchanged(
            order._id,
            order.updatedAt,
            {
                $set: {
                    orderStatus: 'cancelled',
                    paymentStatus: 'refunded',
                    'razorpay.paymentId': razorpayPayment.id,
                    'payment.refundedOnlinePaise': payment.amount,
                    'pricing.refundedAmount': (order.pricing.refundedAmount || 0) + payment.amount / 100,
                    items: order.items.map((item) => ({
                        ...item,
                        cancellation: { ...(item.cancellation || {}), reason: 'out_of_stock_after_payment', cancelledBy: 'system', at: item.cancellation?.at || now }
                    }))
                },
                $push: {
                    statusHistory: {
                        status: 'refunded',
                        note: `Payment received after the order closed and the items are no longer available. ${rupees(payment.amount)} refunded ${where}.`,
                        by: 'system',
                        at: now
                    }
                }
            },
            session
        );
        if (!saved) throw httpError('This order was just updated. Please check again.', 409);
        return saved;
    }

    outcomeView(outcome) {
        if (outcome.type === 'topup') return { purpose: 'wallet_topup', status: 'captured', balance: outcome.balance };
        if (outcome.type === 'already' && outcome.payment?.purpose === 'wallet_topup') return { purpose: 'wallet_topup', status: 'captured' };
        const order = outcome.order;
        return {
            purpose: 'order',
            status: outcome.type,
            orderId: order?._id || outcome.payment?.order,
            orderNumber: order?.orderNumber,
            orderStatus: order?.orderStatus,
            paymentStatus: order?.paymentStatus,
            refundedInFull: Boolean(outcome.refundedInFull)
        };
    }

    // ── Reconcile / expire / cancel ─────────────────────────────────────────────────────────────────────

    /**
     * "Paid but the browser closed": asks Razorpay whether a pending_payment order was paid and finalizes it.
     * At most once every 20 seconds per order unless `force`. Returns true if a payment was applied.
     */
    async reconcileOrder(order, { force = false } = {}) {
        if (order.orderStatus !== PENDING_PAYMENT_STATUS || !order.razorpay?.orderId) return false;
        if (!force && !(await redisUtil.acquireLock(`reconcile:${order._id}`, RECONCILE_EVERY_MS))) return false;
        const payment = await paymentRepository.findByRazorpayOrderId(order.razorpay.orderId);
        if (!payment) return false;
        const paid = paidAttempt(await razorpayUtil.fetchOrderPayments(order.razorpay.orderId), payment);
        if (!paid) return false;
        await this.settle(payment, paid);
        return true;
    }

    // GET /orders/:id: a quiet reconcile first; never fails the request
    async reconcilePendingOrder(userId, orderId) {
        try {
            const order = await orderRepository.findOwn(userId, orderId);
            if (order) await this.reconcileOrder(order);
        } catch (error) {
            console.error('[Payments] reconcile failed for order', String(orderId), error.message);
        }
    }

    // Payment window passed. Razorpay is asked first: an order it has money for is finalized, never cancelled.
    async expireOrder(order) {
        const payment = order.razorpay?.orderId ? await paymentRepository.findByRazorpayOrderId(order.razorpay.orderId) : null;
        if (payment) {
            const paid = paidAttempt(await razorpayUtil.fetchOrderPayments(order.razorpay.orderId), payment);
            if (paid) {
                await this.settle(payment, paid);
                return 'paid';
            }
        }
        await this.undoUnpaidOrder(order._id, 'payment_expired', 'Payment not completed in time');
        return 'expired';
    }

    // Unpaid order cancelled by the customer / admin: same release, after making sure nothing was paid
    async cancelUnpaidOrder(order, { by, reason, note }) {
        const payment = order.razorpay?.orderId ? await paymentRepository.findByRazorpayOrderId(order.razorpay.orderId) : null;
        if (payment) {
            const paid = paidAttempt(await razorpayUtil.fetchOrderPayments(order.razorpay.orderId), payment);
            if (paid) {
                await this.settle(payment, paid);
                throw httpError('Payment for this order was just received, so it is now confirmed. You can cancel it again if you still want to.', 409);
            }
        }
        const saved = await this.undoUnpaidOrder(order._id, 'cancelled', note || 'Order cancelled before payment', { reason, by });
        if (!saved) throw httpError("Couldn't cancel this order. Please try again.", 500);
        return saved;
    }

    // Customer cancel: unpaid orders here, paid ones through the order service (refunds as needed)
    async cancelOrder(userId, orderId, itemId, { reason, note }) {
        const order = await orderRepository.findOwn(userId, orderId);
        if (!order) throw httpError('Order not found.', 404);
        if (order.orderStatus === PENDING_PAYMENT_STATUS) {
            if (itemId) throw httpError('An unpaid order can only be cancelled as a whole.', 400);
            return orderService.toCustomerOrder(await this.cancelUnpaidOrder(order, { by: 'user', reason, note }));
        }
        const saved = await orderService.cancelMyOrder(userId, orderId, itemId, { reason, note });
        this.kickRefunds();
        return saved;
    }

    async expireStaleTopup(payment) {
        const paid = paidAttempt(await razorpayUtil.fetchOrderPayments(payment.razorpayOrderId), payment);
        if (paid) return this.settle(payment, paid);
        return paymentRepository.updateWhere({ _id: payment._id, status: { $in: ['created', 'attempted'] } }, { $set: { status: 'expired' } });
    }

    // ── Refunds to the original method ──────────────────────────────────────────────────────────────────

    // Runs the refund queue soon (only 'source' refunds need Razorpay)
    kickRefunds() {
        if (env.REFUND_DESTINATION !== 'source') return;
        this.processQueuedRefunds().catch((error) => console.error('[Payments] refund queue failed:', error.message));
    }

    /**
     * Queued 'source' refunds → Razorpay. A refund is claimed (queued → processing) before calling, and Razorpay's
     * existing refunds for the payment are checked for our refundKey first, so a crash / retry never refunds twice.
     * Pending refunds are re-checked (when no webhook arrives).
     */
    async processQueuedRefunds() {
        const payments = await paymentRepository.findWithRefundStatus(['queued', 'pending']);
        for (const payment of payments) {
            for (const refund of payment.refunds) {
                if (refund.destination !== 'source') continue;
                try {
                    if (refund.status === 'queued') await this.sendRefund(payment, refund);
                    else if (refund.status === 'pending' && refund.refundId && Date.now() - new Date(refund.at).getTime() > PENDING_REFUND_CHECK_MS) {
                        const latest = await razorpayUtil.fetchRefund(refund.razorpayPaymentId, refund.refundId);
                        await this.applyRefundState(payment, refund.key, latest);
                    }
                } catch (error) {
                    console.error('[Payments] refund', refund.key, 'failed:', error.message);
                }
            }
        }
    }

    async sendRefund(payment, refund) {
        const claimed = await paymentRepository.updateWhere(
            { _id: payment._id, refunds: { $elemMatch: { key: refund.key, status: 'queued' } } },
            { $set: { 'refunds.$.status': 'processing' }, $inc: { 'refunds.$.tries': 1 } }
        );
        if (!claimed) return;
        try {
            const existing = (await razorpayUtil.fetchRefunds(refund.razorpayPaymentId)).find((r) => r.notes?.refundKey === refund.key);
            const razorpayRefund =
                existing ||
                (await razorpayUtil.createRefund(refund.razorpayPaymentId, {
                    amountPaise: refund.amount,
                    receipt: refundReceipt(refund.key),
                    notes: { refundKey: refund.key, ...(payment.order && { orderId: String(payment.order) }) }
                }));
            await this.applyRefundState(payment, refund.key, razorpayRefund);
        } catch (error) {
            const tries = (refund.tries || 0) + 1;
            await paymentRepository.updateWhere(
                { _id: payment._id, 'refunds.key': refund.key },
                { $set: { 'refunds.$.status': tries >= REFUND_MAX_TRIES ? 'failed' : 'queued', 'refunds.$.lastError': error.message } }
            );
            throw error;
        }
    }

    // Razorpay refund (created / processed / failed) → our Payment refund entry and the order line it belongs to
    async applyRefundState(payment, key, razorpayRefund, session) {
        const status = { processed: 'processed', failed: 'failed' }[razorpayRefund.status] || 'pending';
        await paymentRepository.updateWhere(
            { _id: payment._id, 'refunds.key': key },
            {
                $set: {
                    'refunds.$.refundId': razorpayRefund.id,
                    'refunds.$.status': status,
                    ...(status !== 'pending' && { 'refunds.$.processedAt': new Date() })
                }
            },
            session
        );
        const match = ITEM_REFUND_KEY.exec(key);
        if (match) {
            await orderRepository.updateItemRefundStatus(
                match[1],
                match[2],
                { status: { processed: 'completed', failed: 'failed' }[status] || 'pending', refundId: razorpayRefund.id },
                session
            );
        }
        if (status === 'failed') console.error('[Payments] Razorpay refund failed, needs manual action:', key);
    }

    // ── Webhook ─────────────────────────────────────────────────────────────────────────────────────────

    async markEventProcessed(eventId, event, session) {
        try {
            await webhookEventRepository.create(eventId, event, session);
        } catch (error) {
            if (error.code !== DUPLICATE_KEY_ERROR) throw error;
        }
    }

    /**
     * POST /api/payments/razorpay/webhook (raw body). Signature first (400 if wrong), then once per event id.
     * Provider errors (502) bubble up so Razorpay redelivers; anything we can't apply is recorded and acknowledged.
     */
    async handleWebhook(rawBody, signature, eventIdHeader) {
        if (!env.RAZORPAY_WEBHOOK_SECRET) throw httpError('Webhook not configured.', 503);
        if (!razorpayUtil.verifyWebhookSignature(rawBody, signature)) throw httpError('Invalid signature.', 400);

        let body;
        try {
            body = JSON.parse(rawBody.toString('utf8'));
        } catch {
            throw httpError('Invalid payload.', 400);
        }
        const event = body.event;
        const paymentEntity = body.payload?.payment?.entity;
        const refundEntity = body.payload?.refund?.entity;
        const eventId = eventIdHeader || `${event}:${paymentEntity?.id || refundEntity?.id || ''}:${body.created_at}`;

        if (await webhookEventRepository.exists(eventId)) return { duplicate: true };
        console.log('[Webhook]', event, eventId);

        if (['payment.captured', 'payment.authorized', 'order.paid'].includes(event) && paymentEntity) {
            const payment = await paymentRepository.findByRazorpayOrderId(paymentEntity.order_id);
            if (!payment) {
                await this.markEventProcessed(eventId, event);
                return { ignored: true };
            }
            try {
                await this.settle(payment, paymentEntity, { eventId, eventName: event });
            } catch (error) {
                if (error.statusCode === 502) throw error;
                await this.markEventProcessed(eventId, event);
            }
            return { processed: true };
        }

        if (event === 'payment.failed' && paymentEntity) {
            const payment = await paymentRepository.findByRazorpayOrderId(paymentEntity.order_id);
            await withTransaction(async (session) => {
                await webhookEventRepository.create(eventId, event, session);
                if (payment) {
                    await this.recordAttempt(
                        payment._id,
                        {
                            paymentId: paymentEntity.id,
                            status: 'failed',
                            method: paymentEntity.method,
                            errorCode: paymentEntity.error_code,
                            errorDescription: paymentEntity.error_description,
                            errorReason: paymentEntity.error_reason,
                            errorSource: paymentEntity.error_source,
                            errorStep: paymentEntity.error_step
                        },
                        session
                    );
                }
            }).catch((error) => {
                if (error.code !== DUPLICATE_KEY_ERROR) throw error;
            });
            return { processed: true };
        }

        if (['refund.processed', 'refund.failed'].includes(event) && refundEntity) {
            const payment = await paymentRepository.findByRazorpayPaymentId(refundEntity.payment_id);
            const entry = payment?.refunds.find((r) => r.refundId === refundEntity.id || r.key === refundEntity.notes?.refundKey);
            await withTransaction(async (session) => {
                await webhookEventRepository.create(eventId, event, session);
                if (entry) await this.applyRefundState(payment, entry.key, refundEntity, session);
            }).catch((error) => {
                if (error.code !== DUPLICATE_KEY_ERROR) throw error;
            });
            return { processed: true };
        }

        await this.markEventProcessed(eventId, event);
        return { ignored: true };
    }

    // ── Maintenance (every minute, one instance at a time) ──────────────────────────────────────────────

    async runMaintenance() {
        const now = new Date();
        for (const order of await orderRepository.findExpiredPending(now)) {
            try {
                await this.expireOrder(order);
            } catch (error) {
                console.error('[Payments] expiring order', String(order._id), 'failed:', error.message);
            }
        }
        for (const payment of await paymentRepository.findStaleTopups(now)) {
            try {
                await this.expireStaleTopup(payment);
            } catch (error) {
                console.error('[Payments] expiring top-up', String(payment._id), 'failed:', error.message);
            }
        }
        await this.processQueuedRefunds();
    }
}

module.exports = new PaymentService();
