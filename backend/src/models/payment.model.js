const mongoose = require('mongoose');

const PAYMENT_STATUSES = ['created', 'attempted', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded', 'expired'];

// One entry per payment attempt Razorpay told us about (success, failure, duplicate)
const attemptSchema = new mongoose.Schema(
    {
        paymentId: String,
        status: String,
        method: String,
        errorCode: String,
        errorDescription: String,
        errorReason: String,
        errorSource: String,
        errorStep: String,
        at: { type: Date, default: Date.now }
    },
    { _id: false }
);

// Refunds of money received through Razorpay. destination 'wallet' is credited instantly; 'source' goes through the
// Razorpay refunds API: queued (in the transaction) → processing (job claimed it) → pending (created at Razorpay)
// → processed / failed (webhook or status check)
const refundSchema = new mongoose.Schema(
    {
        key: { type: String, required: true }, // our id, e.g. refund:<orderId>:<itemId>
        razorpayPaymentId: String, // which payment to refund (a duplicate capture can differ from the main one)
        refundId: String,
        amount: { type: Number, required: true, min: 1 }, // paise
        status: { type: String, enum: ['queued', 'processing', 'pending', 'processed', 'failed'], required: true },
        destination: { type: String, enum: ['wallet', 'source'], required: true },
        reason: String,
        tries: { type: Number, default: 0 },
        lastError: String,
        at: { type: Date, default: Date.now },
        processedAt: Date
    },
    { _id: false }
);

/**
 * Audit trail of one Razorpay order (an order's online part, or a wallet top-up) and everything that happened to it.
 * Amounts in integer PAISE.
 */
const paymentSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        purpose: { type: String, enum: ['order', 'wallet_topup'], required: true },
        order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        // Wallet top-up: the wallet credit once captured
        walletTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletTransaction' },
        amount: {
            type: Number,
            required: true,
            min: 100,
            validate: { validator: Number.isInteger, message: 'Amount must be whole paise.' }
        },
        currency: { type: String, default: 'INR' },
        razorpayOrderId: { type: String, required: true, unique: true },
        razorpayPaymentId: { type: String },
        status: { type: String, enum: PAYMENT_STATUSES, default: 'created' },
        method: String, // upi / card / netbanking / wallet ...
        attempts: [attemptSchema],
        refunds: [refundSchema],
        refundedPaise: { type: Number, default: 0, min: 0 }, // every refund recorded below (wallet or source)
        capturedAt: Date,
        mode: { type: String, enum: ['test', 'live'], required: true },
        expiresAt: Date
    },
    { timestamps: true }
);

paymentSchema.index({ razorpayPaymentId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1, expiresAt: 1 });
paymentSchema.index({ order: 1, createdAt: -1 });
paymentSchema.index({ 'refunds.status': 1 });

module.exports = mongoose.model('Payment', paymentSchema);
