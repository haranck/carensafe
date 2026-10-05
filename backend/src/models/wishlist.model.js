const mongoose = require('mongoose');

// One document per saved product VARIANT (each size separately; not an array on User): easy to paginate, and
// uniqueness is enforced by an index
const wishlistSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },

        // The saved size / pack (_id of one of the product's variants)
        variant: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        }
    },
    {
        timestamps: true
    }
);

// The same variant can never be saved twice, even with concurrent requests (duplicate → error code 11000); other
// variants of the same product can. Product is part of the key because some products share variant ids.
// Both indexes start with `user`, so a separate `user` index isn't needed.
// (The old { user, product } unique index is dropped by scripts/migrate-wishlist-variants.js.)
wishlistSchema.index({ user: 1, product: 1, variant: 1 }, { unique: true });
// The user's list, newest first
wishlistSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Wishlist', wishlistSchema);
