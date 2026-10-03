const mongoose = require('mongoose');

// One document per saved product (not an array on User): easy to paginate, and uniqueness is enforced by an index
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

        // The variant the user was looking at when they saved it
        variant: {
            type: mongoose.Schema.Types.ObjectId
        }
    },
    {
        timestamps: true
    }
);

// Same product can never be saved twice, even with concurrent requests (duplicate → error code 11000).
// Both indexes start with `user`, so a separate `user` index isn't needed.
wishlistSchema.index({ user: 1, product: 1 }, { unique: true });
// The user's list, newest first
wishlistSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Wishlist', wishlistSchema);
