const mongoose = require('mongoose');
const {
    ORDER_STATUSES,
    ITEM_STATUSES,
    PAYMENT_METHODS,
    PAYMENT_STATUSES,
    CANCEL_REASONS,
    RETURN_REASONS
} = require('../config/orders');

// One line per product VARIANT, snapshotted at order time (later price / name changes don't touch placed orders)
const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    variant: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    name: { type: String, required: true, trim: true },
    image: { type: String, default: null },
    size: { type: String, default: null },
    pieces: { type: Number, default: null },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },

    status: {
        type: String,
        enum: ITEM_STATUSES,
        default: 'active'
    },

    cancellation: {
        reason: { type: String, enum: CANCEL_REASONS },
        note: { type: String, trim: true },
        cancelledBy: { type: String, enum: ['user', 'admin', 'system'] },
        at: Date
    },

    return: {
        reason: { type: String, enum: RETURN_REASONS },
        note: { type: String, trim: true },
        packUnopenedConfirmed: Boolean,
        requestedAt: Date,
        decidedAt: Date,
        decision: { type: String, enum: ['approved', 'rejected'] },
        adminReason: { type: String, trim: true },
        receivedAt: Date
    },

    // Prepaid orders only: what this line refunded (PAISE). The wallet-paid part always goes back to the wallet; the
    // online-paid part goes to the wallet or the original method (REFUND_DESTINATION)
    refund: {
        amount: Number,
        walletPaise: Number,
        onlinePaise: Number,
        onlineDestination: { type: String, enum: ['wallet', 'source'] },
        onlineStatus: { type: String, enum: ['completed', 'pending', 'failed'] },
        creditedAt: Date,
        walletTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletTransaction' },
        razorpayRefundId: String
    }
});

const historySchema = new mongoose.Schema(
    {
        status: { type: String, required: true },
        note: { type: String, trim: true },
        by: { type: String, enum: ['user', 'admin', 'system'], required: true },
        at: { type: Date, default: Date.now }
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        // Readable and unique (the unique index is the orderNumber index): CNS-20261004-4821
        orderNumber: {
            type: String,
            required: true,
            unique: true
        },

        items: {
            type: [orderItemSchema],
            validate: [(items) => items.length > 0, 'An order needs at least one item.']
        },

        // Snapshot of the chosen address (editing / deleting the address later doesn't change the order)
        shippingAddress: {
            fullName: { type: String, required: true },
            phone: { type: String, required: true },
            line1: { type: String, required: true },
            line2: String,
            landmark: String,
            city: { type: String, required: true },
            district: String,
            state: { type: String, required: true },
            pincode: { type: String, required: true },
            country: { type: String, default: 'India' },
            // Home / Work / Other (`type` must be spelled out, or Mongoose reads it as the field's own type)
            type: { type: String },
            location: {
                type: { type: String, enum: ['Point'] },
                coordinates: { type: [Number], default: undefined }
            }
        },

        // Recalculated whenever items are cancelled or returned (see order.service recalculatePricing)
        pricing: {
            subtotal: { type: Number, required: true, min: 0 },
            discount: { type: Number, default: 0, min: 0 },
            shipping: { type: Number, default: 0, min: 0 },
            total: { type: Number, required: true, min: 0 },
            // Owed back for returned lines (and, for online-paid orders, cancelled lines)
            refundableAmount: { type: Number, default: 0, min: 0 },
            // Actually refunded to the wallet (online-paid orders); COD refunds are manual and not tracked here
            refundedAmount: { type: Number, default: 0, min: 0 }
        },

        paymentMethod: {
            type: String,
            enum: PAYMENT_METHODS,
            required: true
        },

        // How a prepaid order was paid and what went back, in PAISE (pricing stays in rupees)
        payment: {
            walletPaise: { type: Number, default: 0, min: 0 },
            onlinePaise: { type: Number, default: 0, min: 0 },
            refundedWalletPaise: { type: Number, default: 0, min: 0 },
            refundedOnlinePaise: { type: Number, default: 0, min: 0 }
        },

        // The Payment document of the online part (audit trail of attempts and refunds)
        paymentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },

        // Client checkout attempt id: the same key always returns the same order (unique per user)
        idempotencyKey: { type: String },

        // pending_payment only: when the reserved stock is released if still unpaid
        expiresAt: Date,

        paymentStatus: {
            type: String,
            enum: PAYMENT_STATUSES,
            default: 'pending'
        },

        orderStatus: {
            type: String,
            enum: ORDER_STATUSES,
            default: 'pending'
        },

        tracking: {
            courier: String,
            trackingNumber: String,
            trackingUrl: String,
            expectedDelivery: Date
        },

        // Appended on every change; drives the tracking timeline
        statusHistory: [historySchema],

        deliveredAt: Date,
        cancelledAt: Date,

        // Online payments: the Razorpay order and the captured payment
        razorpay: {
            orderId: String,
            paymentId: String
        }
    },
    {
        timestamps: true
    }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ 'items.status': 1 });
// Expiry job: unpaid orders past their deadline
orderSchema.index({ orderStatus: 1, expiresAt: 1 });
// One order per checkout attempt (only orders that carry a key)
orderSchema.index(
    { user: 1, idempotencyKey: 1 },
    { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);
orderSchema.index({ 'razorpay.orderId': 1 }, { sparse: true });

module.exports = mongoose.model('Order', orderSchema);
