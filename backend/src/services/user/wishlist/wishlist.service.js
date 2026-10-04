const wishlistRepository = require('../../../repositories/user/wishlist.repository');
const productRepository = require('../../../repositories/user/product.repository');
const cartRepository = require('../../../repositories/user/cart.repository');
const productsService = require('../products/products.service');

const MAX_WISHLIST_ITEMS = 100;
const DUPLICATE_KEY_ERROR = 11000;
const ALREADY_IN_WISHLIST = 'Product is already in your wishlist.';

const httpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

class WishlistService {
    async getWishlist(userId, page, limit) {
        const result = await wishlistRepository.findByUserPaginated(userId, page, limit);

        // Deactivated products, and deleted ones (just `{ _id }`, see the repository), come back flagged
        // `isAvailable: false` rather than dropped, so pages stay full and the user can still remove them
        result.data = result.data.map((item) => ({
            ...productsService.buildProductCard(item.product, item.variant),
            wishlistedAt: item.createdAt
        }));
        return result;
    }

    // Lightweight list for the heart states and the header count
    async getWishlistProductIds(userId) {
        const productIds = await wishlistRepository.findProductIdsByUser(userId);
        return productIds.map(String);
    }

    async addToWishlist(userId, productId, variantId) {
        const product = await productRepository.findActiveById(productId);
        const activeVariants = product ? product.variants.filter((variant) => variant.isActive) : [];
        if (!product || activeVariants.length === 0) {
            throw httpError('Product not found.', 404);
        }

        if (variantId && !activeVariants.some((variant) => String(variant._id) === variantId)) {
            throw httpError('This variant does not belong to the product.', 400);
        }

        const existing = await wishlistRepository.findOne({ user: userId, product: productId });
        if (existing) {
            throw httpError(ALREADY_IN_WISHLIST, 409);
        }

        if (await this.isInCart(userId, productId, variantId)) {
            throw httpError('This item is already in your cart.', 409);
        }

        const count = await wishlistRepository.countByUser(userId);
        if (count >= MAX_WISHLIST_ITEMS) {
            throw httpError(`Your wishlist is full (${MAX_WISHLIST_ITEMS} items). Remove an item to add a new one.`, 409);
        }

        try {
            const item = await wishlistRepository.create({ user: userId, product: productId, variant: variantId });
            return { productId: item.product, variantId: item.variant || null, createdAt: item.createdAt };
        } catch (error) {
            // A concurrent request saved the same product between the check above and this insert
            if (error.code === DUPLICATE_KEY_ERROR) {
                throw httpError(ALREADY_IN_WISHLIST, 409);
            }
            throw error;
        }
    }

    async removeFromWishlist(userId, productId) {
        const result = await wishlistRepository.deleteOne({ user: userId, product: productId });
        if (result.deletedCount === 0) {
            throw httpError('Product is not in your wishlist.', 404);
        }
    }

    // True when the user's cart has this product (and variant, if given)
    async isInCart(userId, productId, variantId) {
        return Boolean(await cartRepository.hasItem(userId, productId, variantId));
    }
}

module.exports = new WishlistService();
