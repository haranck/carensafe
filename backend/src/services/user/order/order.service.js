const orderRepository = require('../../../repositories/user/order.repository');
const productRepository = require('../../../repositories/user/product.repository');
const cartRepository = require('../../../repositories/user/cart.repository');
const addressRepository = require('../../../repositories/user/address.repository');
const paymentRepository = require('../../../repositories/user/payment.repository');
const cartService = require('../cart/cart.service');
const walletService = require('../wallet/wallet.service');
const { withTransaction } = require('../../../utils/transaction');
const env = require('../../../config/envValidation');
const {
    RETURN_WINDOW_DAYS,
    USER_CANCELLABLE_STATUSES,
    RETURNABLE_STATUSES,
    STATUS_GROUPS,
    PENDING_PAYMENT_STATUS
} = require('../../../config/orders');
const {
    readable,
    REASON_LABELS,
    itemTitle,
    recalculatePricing,
    statusAfterReturns,
    isPrepaid,
    toPaise,
    paidAmounts,
    splitRefund,
    refundForItemPaise,
    paymentStatusAfterRefund
} = require('../../../utils/order');

const DAY_MS = 24 * 60 * 60 * 1000;
const ORDER_NUMBER_ATTEMPTS = 5;
const PLACE_ORDER_ATTEMPTS = 3;
const DUPLICATE_KEY_ERROR = 11000;
// Razorpay's smallest payment: ₹1
const MIN_ONLINE_PAISE = 100;

const httpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const sameId = (a, b) => String(a) === String(b);
const pad = (value, length = 2) => String(value).padStart(length, '0');
const rupees = (paise) => `₹${(paise / 100).toLocaleString('en-IN')}`;
const sum = (values) => values.reduce((total, value) => total + value, 0);

const notFound = () => httpError('Order not found.', 404);
const changedMeanwhile = () => httpError('This order was just updated. Refresh and try again.', 409);

const findItem = (order, itemId) => {
    const item = order.items.find((line) => sameId(line._id, itemId));
    if (!item) throw httpError('Item not found in this order.', 404);
    return item;
};

const returnWindowEndsAt = (order) =>
    order.deliveredAt ? new Date(new Date(order.deliveredAt).getTime() + RETURN_WINDOW_DAYS * DAY_MS) : null;

const isReturnWindowOpen = (order, now = new Date()) => {
    const endsAt = returnWindowEndsAt(order);
    return Boolean(endsAt) && now <= endsAt;
};

// What the customer may do right now; the frontend only shows these buttons, the rules stay here
const toCustomerOrder = (order) => {
    const isAwaitingPayment = order.orderStatus === PENDING_PAYMENT_STATUS;
    const canCancelOrder = USER_CANCELLABLE_STATUSES.includes(order.orderStatus);
    const canReturnOrder = RETURNABLE_STATUSES.includes(order.orderStatus) && isReturnWindowOpen(order);
    const items = order.items.map((item) => ({
        ...item,
        canCancel: canCancelOrder && item.status === 'active',
        canReturn: canReturnOrder && item.status === 'active'
    }));
    // Of the Razorpay details only the payment id is shown (support / copy); the rest stays server-side
    const { razorpay, idempotencyKey, ...rest } = order;
    return {
        ...rest,
        items,
        razorpay: razorpay?.paymentId ? { paymentId: razorpay.paymentId } : undefined,
        returnWindowDays: RETURN_WINDOW_DAYS,
        returnWindowEndsAt: returnWindowEndsAt(order),
        // An unpaid order can only be cancelled as a whole
        canCancel: isAwaitingPayment || items.some((item) => item.canCancel),
        canReturn: items.some((item) => item.canReturn),
        canRetryPayment: isAwaitingPayment && Boolean(order.expiresAt) && new Date(order.expiresAt) > new Date()
    };
};

// CNS-20261004-4821 (local date + 4 random digits)
const makeOrderNumber = (now = new Date()) =>
    `CNS-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(Math.floor(Math.random() * 10000), 4)}`;

const toAddressSnapshot = (address) => ({
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    landmark: address.landmark,
    city: address.city,
    district: address.district,
    state: address.state,
    pincode: address.pincode,
    country: address.country || 'India',
    type: address.type,
    ...(address.location?.coordinates?.length === 2 && { location: address.location })
});

const ITEM_ISSUES = {
    unavailable: () => 'no longer available',
    out_of_stock: () => 'out of stock',
    quantity_reduced: (item) => `only ${item.stock} left`
};

class OrderService {
    toCustomerOrder(order) {
        return toCustomerOrder(order);
    }

    async newOrderNumber() {
        let orderNumber = makeOrderNumber();
        for (let attempt = 1; attempt < ORDER_NUMBER_ATTEMPTS && (await orderRepository.existsByNumber(orderNumber)); attempt++) {
            orderNumber = makeOrderNumber();
        }
        return orderNumber;
    }

    // Takes stock for every line; if any can't be taken the whole transaction fails with all of them listed
    async reserveStock(items, session) {
        const soldOut = [];
        for (const item of items) {
            const result = await productRepository.decrementVariantStock(item.product, item.variant, item.quantity, session);
            if (result.modifiedCount === 0) soldOut.push(item.name);
        }
        if (soldOut.length > 0) {
            throw httpError(`Some items just went out of stock: ${soldOut.join(', ')}. Update your cart and try again.`, 409);
        }
    }

    /**
     * Creates the order for a checkout attempt. Everything is recomputed from the cart and live product data (nothing
     * about prices comes from the client). In ONE transaction: stock reserved, order created, wallet part debited and,
     * for COD / wallet, the cart cleared. Online orders wait in pending_payment (stock reserved until expiresAt); the
     * caller creates the Razorpay order after this commits.
     * The same idempotencyKey always returns the first order: { order, isReplay }.
     */
    async createCheckoutOrder(userId, { addressId, paymentMethod, useWallet = false, idempotencyKey }) {
        const existing = await orderRepository.findByIdempotencyKey(userId, idempotencyKey);
        if (existing) return { order: existing, isReplay: true };

        const [address, cart] = await Promise.all([
            addressRepository.findOwn(userId, addressId),
            cartService.getCart(userId)
        ]);
        if (!address) throw httpError('Address not found.', 404);
        if (cart.items.length === 0) throw httpError('Your cart is empty.', 400);

        const problems = cart.items.filter((item) => item.issue);
        if (problems.length > 0) {
            const list = problems
                .map((item) => `${itemTitle(item.name, item.variantName) || 'An item'} (${ITEM_ISSUES[item.issue](item)})`)
                .join(', ');
            throw httpError(`Some items can't be ordered: ${list}. Update your cart and try again.`, 400);
        }

        const items = cart.items.map((item) => ({
            product: item.productId,
            variant: item.variantId,
            name: itemTitle(item.name, item.variantName),
            image: item.image,
            size: item.size,
            pieces: item.pieces,
            price: item.price,
            mrp: item.mrp,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
            status: 'active'
        }));
        const { subtotal, shipping } = cart.summary;
        const totalPaise = toPaise(subtotal + shipping);

        // How it's paid: wallet first when asked, the rest online (Razorpay needs at least ₹1)
        let method = paymentMethod;
        let walletPaise = 0;
        if (paymentMethod === 'wallet' || (paymentMethod === 'razorpay' && useWallet)) {
            const balance = await walletService.getBalance(userId);
            if (paymentMethod === 'wallet') {
                if (balance < totalPaise) throw httpError(`Not enough balance in your wallet. You need ${rupees(totalPaise)}.`, 400);
                walletPaise = totalPaise;
            } else {
                walletPaise = Math.min(balance, totalPaise);
                if (walletPaise === totalPaise) method = 'wallet';
                else if (totalPaise - walletPaise < MIN_ONLINE_PAISE) walletPaise = Math.max(0, totalPaise - MIN_ONLINE_PAISE);
            }
        }
        const onlinePaise = method === 'razorpay' ? totalPaise - walletPaise : 0;

        for (let attempt = 1; attempt <= PLACE_ORDER_ATTEMPTS; attempt++) {
            const orderNumber = await this.newOrderNumber();
            try {
                const order = await withTransaction(async (session) => {
                    await this.reserveStock(items, session);

                    const now = new Date();
                    const isOnline = method === 'razorpay';
                    const placedNote = {
                        cod: 'Order placed (Cash on Delivery)',
                        wallet: `Order placed (paid ${rupees(walletPaise)} from wallet)`,
                        razorpay: walletPaise > 0
                            ? `Order placed: ${rupees(walletPaise)} from wallet, ${rupees(onlinePaise)} to pay online`
                            : `Order placed: ${rupees(onlinePaise)} to pay online`
                    }[method];

                    const created = await orderRepository.create(
                        {
                            user: userId,
                            orderNumber,
                            idempotencyKey,
                            items,
                            shippingAddress: toAddressSnapshot(address),
                            pricing: { subtotal, discount: 0, shipping, total: subtotal + shipping, refundableAmount: 0, refundedAmount: 0 },
                            paymentMethod: method,
                            paymentStatus: method === 'wallet' ? 'paid' : 'pending',
                            orderStatus: isOnline ? PENDING_PAYMENT_STATUS : 'confirmed',
                            payment: { walletPaise, onlinePaise },
                            ...(isOnline && { expiresAt: new Date(now.getTime() + env.PAYMENT_EXPIRY_MINUTES * 60 * 1000) }),
                            statusHistory: [{ status: isOnline ? PENDING_PAYMENT_STATUS : 'confirmed', note: placedNote, by: 'user', at: now }]
                        },
                        session
                    );

                    if (walletPaise > 0) {
                        await walletService.debit(
                            {
                                userId,
                                amountPaise: walletPaise,
                                source: 'order_payment',
                                orderId: created._id,
                                description: `Payment for order ${orderNumber}`,
                                idempotencyKey: `order:${created._id}`
                            },
                            session
                        );
                    }
                    // Online orders keep the cart until the payment is captured
                    if (!isOnline) await cartRepository.clear(userId, session);
                    return created;
                });
                return { order, isReplay: false };
            } catch (error) {
                if (error.code === DUPLICATE_KEY_ERROR) {
                    // The same checkout attempt raced in another request: hand back the order it created
                    if (error.keyPattern?.idempotencyKey) {
                        const again = await orderRepository.findByIdempotencyKey(userId, idempotencyKey);
                        if (again) return { order: again, isReplay: true };
                    }
                    if (error.keyPattern?.orderNumber && attempt < PLACE_ORDER_ATTEMPTS) continue;
                }
                throw error;
            }
        }
        throw httpError("Couldn't place your order. Please try again.", 500);
    }

    /**
     * An unpaid online order ends (payment window passed, Razorpay order couldn't be created, customer / admin
     * cancelled): stock goes back, the wallet part returns to the wallet, every line is cancelled. Inside the caller's
     * transaction. status: 'payment_expired' | 'payment_failed' | 'cancelled'.
     */
    async releaseUnpaidOrder(order, { status, reason, note, by }, session) {
        const now = new Date();
        for (const item of order.items.filter((line) => line.status === 'active')) {
            await productRepository.incrementVariantStock(item.product, item.variant, item.quantity, session);
        }

        const paid = paidAmounts(order);
        const walletBack = paid.walletPaise - paid.refundedWalletPaise;
        if (walletBack > 0) {
            await walletService.credit(
                {
                    userId: order.user,
                    amountPaise: walletBack,
                    source: 'refund',
                    orderId: order._id,
                    description: `Wallet amount returned · ${order.orderNumber}`,
                    idempotencyKey: `release:${order._id}`
                },
                session
            );
        }

        const items = order.items.map((item) =>
            item.status === 'active' ? { ...item, status: 'cancelled', cancellation: { reason, note, cancelledBy: by, at: now } } : item
        );
        const history = [{ status, note, by: by === 'system' ? 'system' : by, at: now }];
        if (walletBack > 0) history.push({ status: 'refunded', note: `${rupees(walletBack)} returned to wallet`, by: 'system', at: now });

        const saved = await orderRepository.updateIfUnchanged(
            order._id,
            order.updatedAt,
            {
                $set: {
                    items,
                    orderStatus: status,
                    paymentStatus: walletBack > 0 ? 'refunded' : 'failed',
                    'payment.refundedWalletPaise': paid.walletPaise,
                    pricing: {
                        ...recalculatePricing(order.pricing, items),
                        refundedAmount: (order.pricing.refundedAmount || 0) + walletBack / 100
                    },
                    cancelledAt: now
                },
                $push: { statusHistory: { $each: history } }
            },
            session
        );
        if (!saved) throw changedMeanwhile();
        return saved;
    }

    // Online payment captured for a pending_payment order: confirmed + paid, bought quantities leave the cart
    async confirmPaidOrder(order, { razorpayPaymentId, method }, session) {
        const saved = await orderRepository.updateIfUnchanged(
            order._id,
            order.updatedAt,
            {
                $set: { orderStatus: 'confirmed', paymentStatus: 'paid', 'razorpay.paymentId': razorpayPaymentId },
                $unset: { expiresAt: '' },
                $push: {
                    statusHistory: { status: 'confirmed', note: `Payment received${method ? ` (${method})` : ''}`, by: 'system', at: new Date() }
                }
            },
            session
        );
        if (!saved) throw changedMeanwhile();
        await cartRepository.removePurchased(order.user, order.items, session);
        return saved;
    }

    /**
     * A payment captured after the order's stock was released (expired / failed / cancelled while paying). If every
     * line can be reserved again and the wallet part debited again, the order is restored and confirmed; otherwise
     * returns null and nothing is changed (the caller refunds the payment). Inside the caller's transaction.
     */
    async reviveUnpaidOrder(order, { razorpayPaymentId, method }, session) {
        for (const item of order.items) {
            const stock = await productRepository.findVariantStock(item.product, item.variant, session);
            if (stock === null || stock < item.quantity) return null;
        }
        const paid = paidAmounts(order);
        if (paid.walletPaise > 0 && (await walletService.getBalance(order.user, session)) < paid.walletPaise) return null;

        // Checked inside the transaction above; a concurrent change makes the transaction retry
        await this.reserveStock(order.items, session);
        if (paid.walletPaise > 0) {
            await walletService.debit(
                {
                    userId: order.user,
                    amountPaise: paid.walletPaise,
                    source: 'order_payment',
                    orderId: order._id,
                    description: `Payment for order ${order.orderNumber}`,
                    idempotencyKey: `order:${order._id}:revived`
                },
                session
            );
        }

        const now = new Date();
        const items = order.items.map((item) => ({ ...item, status: 'active', cancellation: undefined }));
        const shipping = Math.max(0, (paid.walletPaise + paid.onlinePaise) / 100 - sum(items.map((item) => item.lineTotal)) + (order.pricing.discount || 0));
        const saved = await orderRepository.updateIfUnchanged(
            order._id,
            order.updatedAt,
            {
                $set: {
                    items,
                    orderStatus: 'confirmed',
                    paymentStatus: 'paid',
                    'razorpay.paymentId': razorpayPaymentId,
                    'payment.refundedWalletPaise': 0,
                    pricing: {
                        ...recalculatePricing({ ...order.pricing, shipping }, items),
                        refundedAmount: Math.max(0, (order.pricing.refundedAmount || 0) - paid.walletPaise / 100)
                    }
                },
                $unset: { cancelledAt: '', expiresAt: '' },
                $push: {
                    statusHistory: {
                        status: 'confirmed',
                        note: `Payment received after the payment window${method ? ` (${method})` : ''}; order restored`,
                        by: 'system',
                        at: now
                    }
                }
            },
            session
        );
        if (!saved) throw changedMeanwhile();
        await cartRepository.removePurchased(order.user, order.items, session);
        return saved;
    }

    /**
     * Refunds `targets` of a prepaid order inside the caller's transaction (cancel, return received). Each line's
     * refund (minus its discount share, refundForItemPaise) is split between the wallet-paid and online-paid parts in
     * proportion, never beyond what is left of either:
     * - wallet part → back to the wallet (key `refund:<orderId>:<itemId>:wallet`)
     * - online part → REFUND_DESTINATION 'wallet' (instant credit, key `...:online`) or 'source' (queued on the Payment;
     *   the refund job calls Razorpay after the transaction commits)
     * Returns { byItem, walletPaise, onlinePaise, totalPaise, refundedWalletPaise, refundedOnlinePaise, historyEntry }.
     */
    async refundForOrderItems(order, targets, session, { includeShipping = false } = {}) {
        const now = new Date();
        const paid = paidAmounts(order);
        const remaining = { wallet: paid.walletPaise - paid.refundedWalletPaise, online: paid.onlinePaise - paid.refundedOnlinePaise };
        const payment = paid.onlinePaise > 0 ? await paymentRepository.findLatestByOrder(order._id, session) : null;
        const toSource = env.REFUND_DESTINATION === 'source' && Boolean(payment?.razorpayPaymentId);
        const totals = { wallet: 0, online: 0, onlineToSource: 0 };

        const refundPart = async (key, amountPaise, label) => {
            const parts = splitRefund(amountPaise, paid, remaining);
            remaining.wallet -= parts.walletPaise;
            remaining.online -= parts.onlinePaise;
            let walletTransaction;

            const creditWallet = async (amount, suffix, text) => {
                const { transaction } = await walletService.credit(
                    {
                        userId: order.user,
                        amountPaise: amount,
                        source: 'refund',
                        orderId: order._id,
                        description: `${text} · ${order.orderNumber}`,
                        idempotencyKey: `${key}:${suffix}`
                    },
                    session
                );
                walletTransaction = walletTransaction || transaction;
            };

            if (parts.walletPaise > 0) await creditWallet(parts.walletPaise, 'wallet', `Refund for ${label}`);
            if (parts.onlinePaise > 0) {
                if (!toSource) {
                    await creditWallet(parts.onlinePaise, 'online', `Refund for ${label}${parts.walletPaise > 0 ? ' (online part)' : ''}`);
                } else {
                    totals.onlineToSource += parts.onlinePaise;
                }
                // Audit trail on the Payment: 'source' refunds wait for the refund job, wallet ones are already done
                if (payment) {
                    await this.recordPaymentRefund(
                        payment._id,
                        {
                            key,
                            razorpayPaymentId: payment.razorpayPaymentId,
                            amount: parts.onlinePaise,
                            status: toSource ? 'queued' : 'processed',
                            destination: toSource ? 'source' : 'wallet',
                            reason: `Refund for ${label}`,
                            ...(!toSource && { processedAt: now })
                        },
                        session
                    );
                }
            }
            totals.wallet += parts.walletPaise;
            totals.online += parts.onlinePaise;

            return {
                amount: parts.walletPaise + parts.onlinePaise,
                walletPaise: parts.walletPaise,
                onlinePaise: parts.onlinePaise,
                ...(parts.onlinePaise > 0 && { onlineDestination: toSource ? 'source' : 'wallet', onlineStatus: toSource ? 'pending' : 'completed' }),
                creditedAt: now,
                walletTransaction: walletTransaction?._id
            };
        };

        const byItem = {};
        for (const item of targets) {
            const label = `${item.name}${item.size ? ` (${item.size})` : ''}`;
            byItem[String(item._id)] = await refundPart(`refund:${order._id}:${item._id}`, refundForItemPaise(order, item), label);
        }
        if (includeShipping && order.pricing.shipping > 0) {
            await refundPart(`refund:${order._id}:shipping`, toPaise(order.pricing.shipping), 'shipping');
        }

        const totalPaise = totals.wallet + totals.online;
        const toWallet = totalPaise - totals.onlineToSource;
        const notes = [
            toWallet > 0 && `${rupees(toWallet)} refunded to wallet`,
            totals.onlineToSource > 0 && `${rupees(totals.onlineToSource)} refund to the original payment method started`
        ].filter(Boolean);

        return {
            byItem,
            walletPaise: totals.wallet,
            onlinePaise: totals.online,
            totalPaise,
            refundedWalletPaise: paid.refundedWalletPaise + totals.wallet,
            refundedOnlinePaise: paid.refundedOnlinePaise + totals.online,
            queuedSourceRefund: totals.onlineToSource > 0,
            historyEntry: totalPaise > 0 ? { status: 'refunded', note: notes.join(' · '), by: 'system', at: now } : null
        };
    }

    // Adds a refund to a Payment's audit trail (once per key) and updates its status. countAmount false: a duplicate
    // payment's refund (recorded, but not part of this payment's own refunded total / status)
    async recordPaymentRefund(paymentId, refund, session, { countAmount = true } = {}) {
        const updated = await paymentRepository.pushRefundIfAbsent(paymentId, refund, session, { countAmount });
        if (countAmount && updated && ['captured', 'partially_refunded'].includes(updated.status)) {
            await paymentRepository.updateById(
                paymentId,
                { $set: { status: updated.refundedPaise >= updated.amount ? 'refunded' : 'partially_refunded' } },
                session
            );
        }
        return updated;
    }

    // status: one of STATUS_GROUPS (active / delivered / cancelled / returns) or omitted for all
    async getMyOrders(userId, { page, limit, status }) {
        const filter = { user: userId };
        if (status) filter.orderStatus = { $in: STATUS_GROUPS[status] };
        const result = await orderRepository.findPaginated(filter, page, limit);
        return { ...result, data: result.data.map(toCustomerOrder) };
    }

    async getMyOrder(userId, orderId) {
        const order = await orderRepository.findOwn(userId, orderId);
        if (!order) throw notFound();
        return toCustomerOrder(order);
    }

    // Paid / confirmed orders (unpaid pending_payment orders are cancelled through the payment service)
    cancelMyOrder(userId, orderId, itemId, { reason, note }) {
        return this.cancelItems({
            loadOrder: (session) => orderRepository.findOwn(userId, orderId, session),
            itemId,
            reason,
            note,
            by: 'user',
            allowedStatuses: USER_CANCELLABLE_STATUSES
        }).then(toCustomerOrder);
    }

    /**
     * Cancels one item (itemId) or every active item, puts their stock back, refunds prepaid lines and recalculates the
     * totals, in one transaction. Used by the customer and the admin (who may also cancel shipped orders).
     */
    cancelItems({ loadOrder, itemId, reason, note, by, allowedStatuses }) {
        return withTransaction(async (session) => {
            const order = await loadOrder(session);
            if (!order) throw notFound();

            if (order.orderStatus === 'cancelled') throw httpError('This order is already cancelled.', 409);
            if (!allowedStatuses.includes(order.orderStatus)) {
                throw httpError(
                    by === 'user'
                        ? 'Orders can be cancelled only before they are shipped.'
                        : `An order that is ${readable(order.orderStatus)} can't be cancelled.`,
                    400
                );
            }

            let targets;
            if (itemId) {
                const item = findItem(order, itemId);
                if (item.status === 'cancelled') throw httpError('This item is already cancelled.', 409);
                if (item.status !== 'active') throw httpError('This item can no longer be cancelled.', 409);
                targets = [item];
            } else {
                targets = order.items.filter((item) => item.status === 'active');
                if (targets.length === 0) throw httpError('This order is already cancelled.', 409);
            }

            const now = new Date();
            const targetIds = new Set(targets.map((item) => String(item._id)));
            const items = order.items.map((item) =>
                targetIds.has(String(item._id))
                    ? { ...item, status: 'cancelled', cancellation: { reason, note, cancelledBy: by, at: now } }
                    : item
            );
            const isFullyCancelled = items.every((item) => item.status === 'cancelled');
            const orderStatus = isFullyCancelled ? 'cancelled' : 'partially_cancelled';
            const what = itemId ? `Cancelled ${targets[0].name}` : 'Order cancelled';
            const history = [{ status: orderStatus, note: `${what} (${REASON_LABELS[reason]})${note ? `: ${note}` : ''}`, by, at: now }];

            for (const item of targets) {
                await productRepository.incrementVariantStock(item.product, item.variant, item.quantity, session);
            }

            // Prepaid → the cancelled lines (and the shipping, once nothing is left) are refunded
            const prepaid = isPrepaid(order);
            let pricing = recalculatePricing(order.pricing, items, { prepaid });
            let finalItems = items;
            let paymentStatus = order.paymentStatus;
            const extra = {};
            if (prepaid) {
                const refund = await this.refundForOrderItems(order, targets, session, { includeShipping: isFullyCancelled });
                finalItems = items.map((item) => (refund.byItem[String(item._id)] ? { ...item, refund: refund.byItem[String(item._id)] } : item));
                pricing = { ...pricing, refundedAmount: (order.pricing.refundedAmount || 0) + refund.totalPaise / 100 };
                paymentStatus = paymentStatusAfterRefund(finalItems);
                extra['payment.refundedWalletPaise'] = refund.refundedWalletPaise;
                extra['payment.refundedOnlinePaise'] = refund.refundedOnlinePaise;
                if (refund.historyEntry) history.push(refund.historyEntry);
            }

            const saved = await orderRepository.updateIfUnchanged(
                order._id,
                order.updatedAt,
                {
                    $set: {
                        items: finalItems,
                        orderStatus,
                        pricing,
                        paymentStatus,
                        ...extra,
                        ...(isFullyCancelled && { cancelledAt: now })
                    },
                    $push: { statusHistory: { $each: history } }
                },
                session
            );
            if (!saved) throw changedMeanwhile();
            return saved;
        });
    }

    // One item (itemId) or every active item. Only size mismatch, only unopened packs, only within the window.
    async requestReturn(userId, orderId, itemId, { note, packUnopenedConfirmed }) {
        const order = await orderRepository.findOwn(userId, orderId);
        if (!order) throw notFound();

        if (!order.deliveredAt || !RETURNABLE_STATUSES.includes(order.orderStatus)) {
            throw httpError('Returns are available only after the order is delivered.', 400);
        }
        if (!isReturnWindowOpen(order)) throw httpError('Return window has closed.', 400);
        if (packUnopenedConfirmed !== true) throw httpError('Returns are accepted only for unopened packs.', 400);

        let targets;
        if (itemId) {
            const item = findItem(order, itemId);
            if (item.status !== 'active') throw httpError('This item is already cancelled, returned or in a return.', 409);
            targets = [item];
        } else {
            targets = order.items.filter((item) => item.status === 'active');
            if (targets.length === 0) throw httpError('There is nothing left to return in this order.', 409);
        }

        const now = new Date();
        const targetIds = new Set(targets.map((item) => String(item._id)));
        const items = order.items.map((item) =>
            targetIds.has(String(item._id))
                ? {
                    ...item,
                    status: 'return_requested',
                    return: { reason: 'size_mismatch', note, packUnopenedConfirmed: true, requestedAt: now }
                }
                : item
        );
        const what = itemId ? `Return requested for ${targets[0].name}` : 'Return requested for the order';

        const saved = await orderRepository.updateIfUnchanged(order._id, order.updatedAt, {
            $set: { items, orderStatus: statusAfterReturns(items) },
            $push: { statusHistory: { status: 'return_requested', note: `${what} (size mismatch)${note ? `: ${note}` : ''}`, by: 'user', at: now } }
        });
        if (!saved) throw changedMeanwhile();
        return toCustomerOrder(saved);
    }
}

module.exports = new OrderService();
