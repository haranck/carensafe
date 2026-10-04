const orderRepository = require('../../../repositories/user/order.repository');
const productRepository = require('../../../repositories/user/product.repository');
const userRepository = require('../../../repositories/user/user.repository');
const paymentRepository = require('../../../repositories/user/payment.repository');
const orderService = require('../../user/order/order.service');
const paymentService = require('../../user/payment/payment.service');
const { ORDER_STATUSES, ADMIN_CANCELLABLE_STATUSES, STATUS_TRANSITIONS, PENDING_PAYMENT_STATUS } = require('../../../config/orders');
const { readable, recalculatePricing, statusAfterReturns, isPrepaid, paymentStatusAfterRefund } = require('../../../utils/order');
const { withTransaction } = require('../../../utils/transaction');

const RETURN_ITEM_STATUSES = ['return_requested', 'return_approved'];

const httpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const sameId = (a, b) => String(a) === String(b);

// Search text is matched literally, never as a regex pattern
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const notFound = () => httpError('Order not found.', 404);
const changedMeanwhile = () => httpError('This order was just updated. Refresh and try again.', 409);

const findItem = (order, itemId) => {
    const item = order.items.find((line) => sameId(line._id, itemId));
    if (!item) throw httpError('Item not found in this order.', 404);
    return item;
};

// Start of today, server time
const startOfToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

// What the admin panel may offer for this order
// Razorpay audit trail for the admin panel (no secrets are stored, so it can be shown as is)
const toAdminPayment = (payment) => ({
    _id: payment._id,
    purpose: payment.purpose,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    method: payment.method,
    mode: payment.mode,
    razorpayOrderId: payment.razorpayOrderId,
    razorpayPaymentId: payment.razorpayPaymentId,
    attempts: payment.attempts,
    refunds: payment.refunds,
    refundedPaise: payment.refundedPaise,
    capturedAt: payment.capturedAt,
    expiresAt: payment.expiresAt,
    createdAt: payment.createdAt
});

const toAdminOrder = (order, payments = []) => ({
    ...order,
    allowedNextStatuses: STATUS_TRANSITIONS[order.orderStatus] || [],
    canCancel: ADMIN_CANCELLABLE_STATUSES.includes(order.orderStatus) || order.orderStatus === PENDING_PAYMENT_STATUS,
    payments: payments.map(toAdminPayment)
});

class AdminOrderService {
    // search: order number, name / phone on the order, or the customer's name / email / phone
    async listOrders({ page, limit, search, orderStatus, paymentStatus, from, to, hasReturnRequest }) {
        const filter = {};
        if (orderStatus) filter.orderStatus = orderStatus;
        if (paymentStatus) filter.paymentStatus = paymentStatus;
        if (hasReturnRequest) filter['items.status'] = { $in: RETURN_ITEM_STATUSES };
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) {
                // Whole "to" day included
                const end = new Date(to);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        const text = (search || '').trim();
        if (text) {
            const pattern = { $regex: escapeRegex(text), $options: 'i' };
            const words = text.split(/\s+/).map(escapeRegex);
            const customerIds = await userRepository.findIds({
                $or: [
                    { firstName: pattern },
                    { lastName: pattern },
                    { email: pattern },
                    { phone: pattern },
                    // "Priya Sharma": first word in the first name, last word in the last name
                    ...(words.length > 1
                        ? [{ firstName: { $regex: words[0], $options: 'i' }, lastName: { $regex: words[words.length - 1], $options: 'i' } }]
                        : [])
                ]
            });
            filter.$or = [
                { orderNumber: pattern },
                { 'shippingAddress.fullName': pattern },
                { 'shippingAddress.phone': pattern },
                { user: { $in: customerIds } }
            ];
        }

        return orderRepository.findPaginated(filter, page, limit, { withCustomer: true });
    }

    async getStats() {
        const [byStatus, today, pendingReturns] = await Promise.all([
            orderRepository.countByStatus(),
            orderRepository.countSince(startOfToday()),
            orderRepository.countItemsWithStatus(['return_requested'])
        ]);
        const counts = Object.fromEntries(ORDER_STATUSES.map((status) => [status, 0]));
        byStatus.forEach(({ _id, count }) => {
            counts[_id] = count;
        });
        return {
            total: Object.values(counts).reduce((total, count) => total + count, 0),
            byStatus: counts,
            today,
            pendingReturns
        };
    }

    async getOrder(orderId) {
        const [order, payments] = await Promise.all([orderRepository.findByIdWithCustomer(orderId), paymentRepository.findByOrder(orderId)]);
        if (!order) throw notFound();
        return toAdminOrder(order, payments);
    }

    // Only the forward steps in STATUS_TRANSITIONS. Shipping needs courier + tracking number; delivery records
    // deliveredAt and, for COD, marks the payment as paid.
    async updateStatus(orderId, { status, note, courier, trackingNumber, trackingUrl, expectedDelivery }) {
        const order = await orderRepository.findById(orderId);
        if (!order) throw notFound();

        if (status === 'cancelled') {
            throw httpError('Use "Cancel order" to cancel an order (a reason is required).', 400);
        }
        const allowed = STATUS_TRANSITIONS[order.orderStatus] || [];
        if (!allowed.includes(status)) {
            throw httpError(`Cannot change status from ${readable(order.orderStatus)} to ${readable(status)}.`, 400);
        }
        if (status === 'shipped' && (!courier || !trackingNumber)) {
            throw httpError('Courier and tracking number are required to mark an order as shipped.', 400);
        }

        const now = new Date();
        const set = { orderStatus: status };
        if (status === 'shipped') {
            set.tracking = {
                courier: courier.trim(),
                trackingNumber: trackingNumber.trim(),
                ...(trackingUrl && { trackingUrl: trackingUrl.trim() }),
                ...(expectedDelivery && { expectedDelivery: new Date(expectedDelivery) })
            };
        } else if (expectedDelivery) {
            set['tracking.expectedDelivery'] = new Date(expectedDelivery);
        }
        if (status === 'delivered') {
            set.deliveredAt = now;
            if (order.paymentMethod === 'cod') set.paymentStatus = 'paid';
        }

        const defaultNote = status === 'shipped' ? `Shipped with ${courier.trim()} (${trackingNumber.trim()})` : undefined;
        const saved = await orderRepository.updateIfUnchanged(order._id, order.updatedAt, {
            $set: set,
            $push: { statusHistory: { status, note: note?.trim() || defaultNote, by: 'admin', at: now } }
        });
        if (!saved) throw changedMeanwhile();
        return this.getOrder(orderId);
    }

    // Same rules and stock handling as a customer cancellation; admins may also cancel shipped orders
    async cancelOrder(orderId, { reason, note }) {
        const order = await orderRepository.findById(orderId);
        if (!order) throw notFound();
        // Unpaid online order: Razorpay is checked first, then stock and the wallet part go back
        if (order.orderStatus === PENDING_PAYMENT_STATUS) {
            await paymentService.cancelUnpaidOrder(order, { by: 'admin', reason, note });
            return this.getOrder(orderId);
        }
        await orderService.cancelItems({
            loadOrder: (session) => orderRepository.findById(orderId, session),
            itemId: null,
            reason,
            note,
            by: 'admin',
            allowedStatuses: ADMIN_CANCELLABLE_STATUSES
        });
        paymentService.kickRefunds();
        return this.getOrder(orderId);
    }

    // Approve or reject one requested return. A rejection needs a reason (shown to the customer).
    async decideReturn(orderId, itemId, { decision, adminReason }) {
        const order = await orderRepository.findById(orderId);
        if (!order) throw notFound();
        const item = findItem(order, itemId);
        if (item.status !== 'return_requested') throw httpError('This item has no pending return request.', 409);

        const reason = (adminReason || '').trim();
        if (decision === 'rejected' && reason.length < 5) {
            throw httpError('A reason of at least 5 characters is required to reject a return.', 400);
        }

        const now = new Date();
        const items = order.items.map((line) =>
            sameId(line._id, itemId)
                ? {
                    ...line,
                    status: decision === 'approved' ? 'return_approved' : 'return_rejected',
                    return: { ...line.return, decision, decidedAt: now, ...(reason && { adminReason: reason }) }
                }
                : line
        );
        const label = decision === 'approved' ? 'Return approved' : 'Return rejected';

        const saved = await orderRepository.updateIfUnchanged(order._id, order.updatedAt, {
            $set: { items, orderStatus: statusAfterReturns(items) },
            $push: {
                statusHistory: {
                    status: decision === 'approved' ? 'return_approved' : 'return_rejected',
                    note: `${label} for ${item.name}${reason ? `: ${reason}` : ''}`,
                    by: 'admin',
                    at: now
                }
            }
        });
        if (!saved) throw changedMeanwhile();
        return this.getOrder(orderId);
    }

    // The unopened pack came back: restock the variant and add the line to the refundable amount. A prepaid order's line
    // is refunded in the same transaction (orderService.refundForOrderItems); COD refunds stay manual.
    async markReturnReceived(orderId, itemId) {
        await withTransaction(async (session) => {
            const order = await orderRepository.findById(orderId, session);
            if (!order) throw notFound();
            const item = findItem(order, itemId);
            if (item.status !== 'return_approved') throw httpError('Only approved returns can be marked as received.', 409);

            const now = new Date();
            let items = order.items.map((line) =>
                sameId(line._id, itemId) ? { ...line, status: 'returned', return: { ...line.return, receivedAt: now } } : line
            );
            const orderStatus = statusAfterReturns(items);
            const prepaid = isPrepaid(order);
            let pricing = recalculatePricing(order.pricing, items, { prepaid });
            let paymentStatus = order.paymentStatus;
            const extra = {};
            const history = [{ status: 'returned', note: `Return received for ${item.name} (restocked)`, by: 'admin', at: now }];

            await productRepository.incrementVariantStock(item.product, item.variant, item.quantity, session);

            if (prepaid) {
                const refund = await orderService.refundForOrderItems(order, [item], session);
                const credited = refund.byItem[String(item._id)];
                if (credited) items = items.map((line) => (sameId(line._id, itemId) ? { ...line, refund: credited } : line));
                pricing = { ...pricing, refundedAmount: (order.pricing.refundedAmount || 0) + refund.totalPaise / 100 };
                paymentStatus = paymentStatusAfterRefund(items);
                extra['payment.refundedWalletPaise'] = refund.refundedWalletPaise;
                extra['payment.refundedOnlinePaise'] = refund.refundedOnlinePaise;
                if (refund.historyEntry) history.push(refund.historyEntry);
            }

            const saved = await orderRepository.updateIfUnchanged(
                order._id,
                order.updatedAt,
                {
                    $set: { items, orderStatus, pricing, paymentStatus, ...extra },
                    $push: { statusHistory: { $each: history } }
                },
                session
            );
            if (!saved) throw changedMeanwhile();
        });
        paymentService.kickRefunds();
        return this.getOrder(orderId);
    }

    // Every item with an open return (requested or approved, waiting for the pack), across orders
    listReturnItems({ page, limit }) {
        return orderRepository.findItemsWithStatusPaginated(RETURN_ITEM_STATUSES, page, limit);
    }
}

module.exports = new AdminOrderService();
