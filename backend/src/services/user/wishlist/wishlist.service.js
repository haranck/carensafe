const wishlistRepository = require('../../../repositories/user/wishlist.repository');
const productRepository = require('../../../repositories/user/product.repository');
const cartRepository = require('../../../repositories/user/cart.repository');
const productsService = require('../products/products.service');

const MAX_WISHLIST_ITEMS = 100;
const DUPLICATE_KEY_ERROR = 11000;
const ALREADY_IN_WISHLIST = 'This size is already in your wishlist.';

const httpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const sameId = (a, b) => String(a) === String(b);

/**
 * One wishlist card for exactly the saved variant. If that variant is gone or switched off (or the whole product),
 * the card is flagged `isAvailable: false` instead of showing another size, so the user can still remove it.
 * Variants have no MRP / pieces fields yet: MRP falls back to the price and pieces to null (like the cart).
 */
const toWishlistCard = (item) => {
    const product = item.product || {};
    const variant = (product.variants || []).find((v) => sameId(v._id, item.variant));
    const card = productsService.buildProductCard(product, item.variant);
    const isVariantAvailable = Boolean(product.isActive && variant?.isActive);
    const shown = variant || card.defaultVariant;

    return {
        ...card,
        wishlistItemId: item._id,
        // Price and size of the saved variant only (not the product's range)
        minPrice: shown?.price ?? card.minPrice,
        maxPrice: shown?.price ?? card.maxPrice,
        sizes: shown?.size ? [shown.size] : [],
        isAvailable: card.isAvailable && isVariantAvailable,
        inStock: isVariantAvailable && (variant?.stock || 0) > 0,
        defaultVariant: {
            ...card.defaultVariant,
            _id: item.variant,
            name: shown?.name,
            size: shown?.size,
            price: shown?.price,
            stock: variant ? variant.stock : 0,
            images: variant ? (variant.images || []).slice(0, 2).map((image) => image.url) : card.defaultVariant.images,
            mrp: shown ? Math.max(shown.mrp || 0, shown.price || 0) : null,
            pieces: shown?.pieces ?? null
        },
        wishlistedAt: item.createdAt
    };
};

class WishlistService {
    async getWishlist(userId, page, limit) {
        const result = await wishlistRepository.findByUserPaginated(userId, page, limit);
        result.data = result.data.map(toWishlistCard);
        return result;
    }

    // [{ itemId, productId, variantId }] for the heart states (per size) and the header count
    async getWishlistKeys(userId) {
        const items = await wishlistRepository.findKeysByUser(userId);
        return items.map((item) => ({ itemId: String(item._id), productId: String(item.product), variantId: String(item.variant) }));
    }

    // A size of a product: the variant must belong to the product and be active. Another size of a saved product is fine.
    async addToWishlist(userId, productId, variantId) {
        const product = await productRepository.findActiveById(productId);
        if (!product) {
            throw httpError('Product not found.', 404);
        }

        const variant = product.variants.find((v) => sameId(v._id, variantId));
        if (!variant) {
            throw httpError('This variant does not belong to the product.', 400);
        }
        if (!variant.isActive) {
            throw httpError('This size is no longer available.', 400);
        }

        const existing = await wishlistRepository.findOne({ user: userId, product: productId, variant: variantId });
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
            return { itemId: item._id, productId: item.product, variantId: item.variant, createdAt: item.createdAt };
        } catch (error) {
            // A concurrent request saved the same size between the check above and this insert
            if (error.code === DUPLICATE_KEY_ERROR) {
                throw httpError(ALREADY_IN_WISHLIST, 409);
            }
            throw error;
        }
    }

    // One saved size (by wishlist item id); another user's item simply isn't found
    async removeItem(userId, itemId) {
        const result = await wishlistRepository.deleteOne({ _id: itemId, user: userId });
        if (result.deletedCount === 0) {
            throw httpError('This item is not in your wishlist.', 404);
        }
    }

    async getItem(userId, itemId) {
        const item = await wishlistRepository.findOne({ _id: itemId, user: userId });
        if (!item) {
            throw httpError('This item is not in your wishlist.', 404);
        }
        return item;
    }

    // True when the user's cart has this exact product + variant
    async isInCart(userId, productId, variantId) {
        return Boolean(await cartRepository.hasItem(userId, productId, variantId));
    }
}

module.exports = new WishlistService();
