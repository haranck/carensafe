const mongoose = require('mongoose');
const { MAX_ITEM_QUANTITY } = require('../config/cart');

// No prices here: price, MRP, stock and images are always read from the live product/variant,
// so price and stock changes show up in the cart automatically
const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },

    variant: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    quantity: {
        type: Number,
        required: true,
        min: 1,
        max: MAX_ITEM_QUANTITY
    },

    addedAt: {
        type: Date,
        default: Date.now
    }
});

// One cart per user (a cart is small, so an items array is fine)
const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },

        items: [cartItemSchema]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Cart', cartSchema);
