const Cart = require('../../models/cart.model');

// Whole variants, so future variant fields (e.g. mrp, pieces) reach the cart without a change here
const PRODUCT_FIELDS = 'name isActive createdAt variants';

class CartRepository {
    findByUser(userId) {
        return Cart.findOne({ user: userId }).lean();
    }

    findByUserWithProducts(userId) {
        return Cart.findOne({ user: userId })
            // A product that no longer exists would populate as null and lose its id; keep the id instead
            .populate({ path: 'items.product', select: PRODUCT_FIELDS, transform: (doc, id) => doc || { _id: id } })
            .lean();
    }

    // Creates the cart on first use. Never pushes a variant that's already a line: if the cart has it, the upsert
    // tries to insert a second cart for the user and fails with a duplicate key error (11000) instead
    pushItem(userId, item) {
        return Cart.findOneAndUpdate(
            { user: userId, 'items.variant': { $ne: item.variant } },
            { $push: { items: item } },
            { upsert: true, returnDocument: 'after', runValidators: true }
        ).lean();
    }

    updateItemQuantity(userId, itemId, quantity) {
        return Cart.findOneAndUpdate(
            { user: userId, 'items._id': itemId },
            { $set: { 'items.$.quantity': quantity } },
            { returnDocument: 'after', runValidators: true }
        ).lean();
    }

    // null when the line isn't in this user's cart
    pullItem(userId, itemId) {
        return Cart.findOneAndUpdate(
            { user: userId, 'items._id': itemId },
            { $pull: { items: { _id: itemId } } },
            { returnDocument: 'after' }
        ).lean();
    }

    clear(userId) {
        return Cart.updateOne({ user: userId }, { $set: { items: [] } });
    }

    // Any variant of the product when variantId is omitted
    hasItem(userId, productId, variantId) {
        const line = variantId ? { product: productId, variant: variantId } : { product: productId };
        return Cart.exists({ user: userId, items: { $elemMatch: line } });
    }
}

module.exports = new CartRepository();
