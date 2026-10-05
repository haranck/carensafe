const cartRepository = require('../../../repositories/user/cart.repository');
const productRepository = require('../../../repositories/user/product.repository');
const wishlistRepository = require('../../../repositories/user/wishlist.repository');
const productsService = require('../products/products.service');
const wishlistService = require('../wishlist/wishlist.service');
const { MAX_ITEM_QUANTITY, MAX_CART_ITEMS } = require('../../../config/cart');
const { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } = require('../../../config/shipping');

const RECOMMENDATION_LIMIT = 8;
// Newest active products considered for "You may also like"
const RECOMMENDATION_POOL = 50;
const DUPLICATE_KEY_ERROR = 11000;

const httpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const sameId = (a, b) => String(a) === String(b);

const sum = (values) => values.reduce((total, value) => total + value, 0);

// Units in the cart (header badge), whatever their state
const countUnits = (cart) => sum((cart?.items || []).map((item) => item.quantity));

const findLine = (cart, itemId) => {
    const line = cart?.items.find((item) => sameId(item._id, itemId));
    if (!line) {
        throw httpError('Item not found in your cart.', 404);
    }
    return line;
};

const toItemRef = (item) => ({ itemId: item._id, productId: item.product, variantId: item.variant, quantity: item.quantity });

// One cart line from live product data. Deleted / inactive products and variants come back `unavailable`,
// sold-out variants `out_of_stock` (both excluded from totals); a quantity above the stock is shown reduced
// (`quantity_reduced`) without writing it back, so checkout must check stock again.
const buildLine = (item) => {
    const product = item.product || {};
    const variants = product.variants || [];
    const variant = variants.find((v) => sameId(v._id, item.variant));
    const isListed = Boolean(product.name && product.isActive && variant && variant.isActive);
    const stock = isListed ? variant.stock : 0;

    let issue = null;
    if (!isListed) issue = 'unavailable';
    else if (stock <= 0) issue = 'out_of_stock';
    else if (stock < item.quantity) issue = 'quantity_reduced';

    const isAvailable = issue === null || issue === 'quantity_reduced';
    const quantity = issue === 'quantity_reduced' ? stock : item.quantity;
    const price = variant ? variant.price : null;
    // Variants have no MRP yet: it falls back to the price (no discount shown) until they do
    const mrp = variant ? Math.max(variant.mrp || 0, variant.price) : null;
    const imageVariant = variant || variants[0];

    return {
        itemId: item._id,
        productId: product._id,
        variantId: item.variant,
        name: product.name || null,
        variantName: variant ? variant.name : null,
        image: imageVariant?.images?.[0]?.url || null,
        size: variant ? variant.size : null,
        pieces: variant?.pieces ?? null,
        price,
        mrp,
        quantity,
        lineTotal: price === null ? 0 : price * quantity,
        stock,
        maxQuantity: Math.min(MAX_ITEM_QUANTITY, stock),
        isAvailable,
        issue,
        addedAt: item.addedAt
    };
};

// Computed here from live data, never taken from the client
const buildSummary = (lines, cart) => {
    const available = lines.filter((line) => line.isAvailable);
    const subtotal = sum(available.map((line) => line.lineTotal));
    const mrpTotal = sum(available.map((line) => line.mrp * line.quantity));
    const chargesShipping = SHIPPING_FEE > 0 && subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD;
    const shipping = chargesShipping ? SHIPPING_FEE : 0;

    return {
        itemCount: sum(available.map((line) => line.quantity)),
        totalQuantity: countUnits(cart),
        subtotal,
        mrpTotal,
        savings: mrpTotal - subtotal,
        shipping,
        shippingFee: SHIPPING_FEE,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        amountForFreeShipping: SHIPPING_FEE > 0 ? Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal) : 0,
        total: subtotal + shipping
    };
};

// { items (newest first), summary } for a cart populated with its products (or null)
const toCartResponse = (cart) => {
    const items = [...(cart?.items || [])]
        .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
        .map(buildLine);
    return { items, summary: buildSummary(items, cart) };
};

// Recommendation card for one specific variant: its own price and size, not the product's range
const variantCard = (product, variant) => ({
    ...productsService.buildProductCard(product, variant._id),
    minPrice: variant.price,
    maxPrice: variant.price,
    sizes: [variant.size]
});

class CartService {
    async getCart(userId) {
        const cart = await cartRepository.findByUserWithProducts(userId);
        return toCartResponse(cart);
    }

    async getCount(userId) {
        const cart = await cartRepository.findByUser(userId);
        return countUnits(cart);
    }

    // Active product + active, in-stock variant of it
    async getPurchasableVariant(productId, variantId) {
        const product = await productRepository.findActiveById(productId);
        if (!product) {
            throw httpError('Product not found.', 404);
        }

        const variant = product.variants.find((v) => sameId(v._id, variantId));
        if (!variant) {
            throw httpError('This variant does not belong to the product.', 400);
        }
        if (!variant.isActive) {
            throw httpError('This item is no longer available.', 400);
        }
        if (variant.stock <= 0) {
            throw httpError('This item is out of stock.', 400);
        }
        return variant;
    }

    // Same variant already in the cart → its quantity goes up, never past min(10, stock)
    async increaseQuantity(userId, line, variant, quantity) {
        const limit = Math.min(MAX_ITEM_QUANTITY, variant.stock);
        if (line.quantity + quantity > limit) {
            const reason = variant.stock < MAX_ITEM_QUANTITY
                ? `Only ${variant.stock} left in stock`
                : `You can buy up to ${MAX_ITEM_QUANTITY} of this item`;
            throw httpError(`${reason}, and you already have ${line.quantity} in your cart.`, 409);
        }

        const cart = await cartRepository.updateItemQuantity(userId, line._id, line.quantity + quantity);
        const item = findLine(cart, line._id);
        return { item: toItemRef(item), count: countUnits(cart) };
    }

    async addItem(userId, productId, variantId, quantity = 1) {
        const variant = await this.getPurchasableVariant(productId, variantId);
        const cart = await cartRepository.findByUser(userId);
        const existing = cart?.items.find((item) => sameId(item.variant, variantId));
        if (existing) {
            return this.increaseQuantity(userId, existing, variant, quantity);
        }

        if (quantity > variant.stock) {
            throw httpError(`Only ${variant.stock} left in stock.`, 400);
        }
        if ((cart?.items.length || 0) >= MAX_CART_ITEMS) {
            throw httpError(`Your cart is full (${MAX_CART_ITEMS} items). Remove an item to add a new one.`, 409);
        }

        try {
            const updated = await cartRepository.pushItem(userId, { product: productId, variant: variantId, quantity });
            const item = updated.items.find((line) => sameId(line.variant, variantId));
            return { item: toItemRef(item), count: countUnits(updated) };
        } catch (error) {
            // A concurrent request added the same variant between the read above and this write
            if (error.code === DUPLICATE_KEY_ERROR) {
                const current = await cartRepository.findByUser(userId);
                const line = current?.items.find((item) => sameId(item.variant, variantId));
                if (line) return this.increaseQuantity(userId, line, variant, quantity);
            }
            throw error;
        }
    }

    async updateQuantity(userId, itemId, quantity) {
        const line = findLine(await cartRepository.findByUser(userId), itemId);

        const product = await productRepository.findActiveById(line.product);
        const variant = product?.variants.find((v) => sameId(v._id, line.variant));
        if (!variant || !variant.isActive) {
            throw httpError('This item is no longer available.', 400);
        }
        if (variant.stock <= 0) {
            throw httpError('This item is out of stock.', 400);
        }
        if (quantity > variant.stock) {
            throw httpError(`Only ${variant.stock} left in stock.`, 400);
        }

        await cartRepository.updateItemQuantity(userId, itemId, quantity);
        return this.getCart(userId);
    }

    async removeItem(userId, itemId) {
        const cart = await cartRepository.pullItem(userId, itemId);
        if (!cart) {
            throw httpError('Item not found in your cart.', 404);
        }
        return this.getCart(userId);
    }

    async clearCart(userId) {
        await cartRepository.clear(userId);
        return toCartResponse(null);
    }

    // Remove from the cart first (the wishlist refuses items that are in the cart), then save to the wishlist;
    // if saving fails the line goes back into the cart. Already in the wishlist counts as moved.
    async moveToWishlist(userId, itemId) {
        const line = findLine(await cartRepository.findByUser(userId), itemId);
        const alreadySaved = await wishlistRepository.findOne({ user: userId, product: line.product, variant: line.variant });

        await cartRepository.pullItem(userId, itemId);
        if (!alreadySaved) {
            try {
                await wishlistService.addToWishlist(userId, String(line.product), String(line.variant));
            } catch (error) {
                await cartRepository.pushItem(userId, {
                    product: line.product,
                    variant: line.variant,
                    quantity: line.quantity,
                    addedAt: line.addedAt
                });
                throw error;
            }
        }
        return this.getCart(userId);
    }

    // Wishlist "Move to Cart": add one of exactly the saved variant, then remove only that wishlist item
    async moveFromWishlist(userId, wishlistItemId) {
        const saved = await wishlistService.getItem(userId, wishlistItemId);
        const result = await this.addItem(userId, String(saved.product), String(saved.variant), 1);
        await wishlistService.removeItem(userId, wishlistItemId);
        return result;
    }

    // Up to 8 in-stock product cards, never a variant already in the cart:
    // 1. other variants/sizes of products in the cart, 2. products of the same kind (combo or not; it stands in
    // for category until products have one), 3. the newest products (bestsellers stand-in until orders exist)
    async getRecommendations(userId) {
        const [cart, newest] = await Promise.all([
            cartRepository.findByUserWithProducts(userId),
            productRepository.findActiveNewest(RECOMMENDATION_POOL)
        ]);
        const items = cart?.items || [];
        const cartVariantIds = new Set(items.map((item) => String(item.variant)));
        const cartProducts = items.map((item) => item.product).filter((product) => product?.name);
        const cartProductIds = new Set(items.map((item) => String(item.product?._id)));
        const isRecommendable = (variant) =>
            variant.isActive && variant.stock > 0 && !cartVariantIds.has(String(variant._id));

        const cards = [];
        const seenProducts = new Set();
        cartProducts.forEach((product) => {
            if (!product.isActive || seenProducts.has(String(product._id))) return;
            seenProducts.add(String(product._id));
            product.variants.filter(isRecommendable).forEach((variant) => cards.push(variantCard(product, variant)));
        });

        const cartKinds = new Set(cartProducts.map((product) => productsService.buildProductCard(product).isCombo));
        // Every variant is its own card (like the shop)
        const others = newest
            .filter((product) => !cartProductIds.has(String(product._id)))
            .flatMap((product) => product.variants.filter(isRecommendable).map((variant) => variantCard(product, variant)));
        const sameKind = others.filter((card) => cartKinds.has(card.isCombo));
        const otherKind = others.filter((card) => !cartKinds.has(card.isCombo));

        return [...cards, ...sameKind, ...otherKind].slice(0, RECOMMENDATION_LIMIT);
    }
}

module.exports = new CartService();
