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
        cancelledBy: { type: String, enum: ['user', 'admin'] },
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
            refundableAmount: { type: Number, default: 0, min: 0 }
        },

        paymentMethod: {
            type: String,
            enum: PAYMENT_METHODS,
            required: true
        },

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

        // Filled by the Razorpay integration (online payments); empty for COD
        razorpay: {
            orderId: String,
            paymentId: String,
            signature: String
        }
    },
    {
        timestamps: true
    }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ 'items.status': 1 });

module.exports = mongoose.model('Order', orderSchema);
