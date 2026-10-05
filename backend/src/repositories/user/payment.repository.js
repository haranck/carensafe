const Payment = require('../../models/payment.model');

// Payments (Razorpay orders: an order's online part or a wallet top-up). Every method can join a transaction.
class PaymentRepository {
    async create(paymentData, session) {
        const [payment] = await Payment.create([paymentData], { session });
        return payment.toObject();
    }

    findById(paymentId, session) {
        return Payment.findById(paymentId).session(session || null).lean();
    }

    findByRazorpayOrderId(razorpayOrderId, session) {
        return Payment.findOne({ razorpayOrderId }).session(session || null).lean();
    }

    findByRazorpayPaymentId(razorpayPaymentId, session) {
        return Payment.findOne({ razorpayPaymentId }).session(session || null).lean();
    }

    // The payment of an order's online part (the newest, should there ever be more than one)
    findLatestByOrder(orderId, session) {
        return Payment.findOne({ order: orderId }).sort({ createdAt: -1 }).session(session || null).lean();
    }

    findByOrder(orderId) {
        return Payment.find({ order: orderId }).sort({ createdAt: -1 }).lean();
    }

    // Conditional update: null when nothing matched `filter` (used to claim work and for state checks)
    updateWhere(filter, update, session) {
        return Payment.findOneAndUpdate(filter, update, { returnDocument: 'after', runValidators: true, session }).lean();
    }

    updateById(paymentId, update, session) {
        return this.updateWhere({ _id: paymentId }, update, session);
    }

    // Adds a refund only if no refund with the same key exists yet (idempotent). countAmount false: the refund is of
    // another Razorpay payment (a duplicate) and doesn't count toward this payment's refunded total
    pushRefundIfAbsent(paymentId, refund, session, { countAmount = true } = {}) {
        return Payment.findOneAndUpdate(
            { _id: paymentId, 'refunds.key': { $ne: refund.key } },
            { $push: { refunds: refund }, $inc: { refundedPaise: countAmount ? refund.amount : 0 } },
            { returnDocument: 'after', runValidators: true, session }
        ).lean();
    }

    // Payments with a refund in one of `statuses` (refund job)
    findWithRefundStatus(statuses, limit = 20) {
        return Payment.find({ 'refunds.status': { $in: statuses } }).limit(limit).lean();
    }

    // Wallet top-ups still waiting for payment after their deadline (expiry job)
    findStaleTopups(now, limit = 20) {
        return Payment.find({ purpose: 'wallet_topup', status: { $in: ['created', 'attempted'] }, expiresAt: { $lt: now } })
            .limit(limit)
            .lean();
    }
}

module.exports = new PaymentRepository();
