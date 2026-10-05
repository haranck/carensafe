const mongoose = require('mongoose');

// Every balance change. Amounts are integer PAISE. `idempotencyKey` (unique) makes a credit / debit happen once,
// e.g. `refund:<orderId>:<itemId>`.
const walletTransactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        type: {
            type: String,
            enum: ['credit', 'debit'],
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 1,
            validate: { validator: Number.isInteger, message: 'Amount must be whole paise.' }
        },

        source: {
            type: String,
            enum: ['refund', 'topup', 'order_payment', 'adjustment'],
            required: true
        },

        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        },

        // _id of the order item (refunds)
        orderItem: {
            type: mongoose.Schema.Types.ObjectId
        },

        description: {
            type: String,
            trim: true
        },

        balanceAfter: {
            type: Number,
            required: true,
            min: 0
        },

        status: {
            type: String,
            enum: ['completed', 'pending', 'failed'],
            default: 'completed'
        },

        idempotencyKey: {
            type: String,
            required: true,
            unique: true
        }
    },
    {
        timestamps: true
    }
);

walletTransactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
