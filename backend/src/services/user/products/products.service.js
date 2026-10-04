const { Types } = require('mongoose');
const productRepository = require('../../../repositories/user/product.repository');

// TODO: replace name matching and the single category with real `category` / `isCombo` fields on the product model
const COMBO_PATTERN = /combo/i;
const DEFAULT_CATEGORY = { value: 'sanitary_pads', label: 'Sanitary Pads' };
const NEW_PRODUCT_MS = 30 * 24 * 60 * 60 * 1000;
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const SORT_OPTIONS = {
    newest: { createdAt: -1, _id: 1 },
    name_asc: { name: 1, _id: 1 },
    name_desc: { name: -1, _id: 1 },
    price_asc: { minPrice: 1, _id: 1 },
    price_desc: { minPrice: -1, _id: 1 }
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isComboName = (name) => COMBO_PATTERN.test(name);

const isNewProduct = (createdAt) => Date.now() - new Date(createdAt).getTime() < NEW_PRODUCT_MS;

// Combo variants use sizes like "XL/XXL"; each part counts as a size for filtering
const splitSize = (size = '') => size.split('/').map((part) => part.trim().toUpperCase()).filter(Boolean);

const sizeRank = (size) => {
    const index = SIZE_ORDER.indexOf(size);
    return index === -1 ? SIZE_ORDER.length : index;
};

const sortSizes = (sizes) => [...sizes].sort((a, b) => sizeRank(a) - sizeRank(b) || a.localeCompare(b));

// Storefront card (one active product) + derived fields
const toCardItem = (item) => ({
    ...item,
    sizes: [...new Set(item.sizes)],
    category: DEFAULT_CATEGORY.value,
    isCombo: isComboName(item.name),
    isNew: isNewProduct(item.createdAt)
});

// Variant-level conditions must all hold for the same variant (e.g. "XL under ₹200 and in stock")
const buildVariantFilter = ({ sizes, minPrice, maxPrice, inStock }) => {
    const conditions = [];
    if (sizes.length > 0) {
        const variantSizes = {
            $map: { input: { $split: ['$$v.size', '/'] }, as: 's', in: { $toUpper: { $trim: { input: '$$s' } } } }
        };
        conditions.push({ $gt: [{ $size: { $setIntersection: [variantSizes, { $literal: sizes }] } }, 0] });
    }
    if (minPrice !== undefined) conditions.push({ $gte: ['$$v.price', minPrice] });
    if (maxPrice !== undefined) conditions.push({ $lte: ['$$v.price', maxPrice] });
    if (inStock) conditions.push({ $gt: ['$$v.stock', 0] });
    return conditions.length > 0 ? { $and: conditions } : true;
};

const notFoundError = () => {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    return error;
};

class ProductsService {
    async getProducts({ page, limit, search, category, combo, sizes = [], minPrice, maxPrice, inStock, sort }) {
        // Every product is in the default category until the model has a real one
        if (category && category !== DEFAULT_CATEGORY.value) {
            return { data: [], total: 0, page, limit, totalPages: 0 };
        }

        const match = {};
        if (combo === true) {
            match.name = COMBO_PATTERN;
        } else if (combo === false) {
            match.name = { $not: COMBO_PATTERN };
        }

        if (search) {
            const pattern = new RegExp(escapeRegex(search), 'i');
            match.$or = [{ name: pattern }, { description: pattern }, { 'variants.name': pattern }];
        }

        const result = await productRepository.findActiveProductsPaginated({
            match,
            variantFilter: buildVariantFilter({
                sizes: sizes.map((size) => size.trim().toUpperCase()).filter(Boolean),
                minPrice,
                maxPrice,
                inStock
            }),
            sort: SORT_OPTIONS[sort] || SORT_OPTIONS.newest,
            page,
            limit
        });

        result.data = result.data.map(toCardItem);
        return result;
    }

    // Options for the shop filters, computed from what's actually for sale
    async getFilterOptions() {
        const products = await productRepository.findActiveForFilters();
        const sizes = new Set();
        let minPrice = Infinity;
        let maxPrice = -Infinity;
        let productCount = 0;
        let comboCount = 0;

        products.forEach((product) => {
            const variants = product.variants.filter((variant) => variant.isActive);
            if (variants.length === 0) return;

            // The shop lists every variant as its own card, so counts are per variant
            productCount += variants.length;
            if (isComboName(product.name)) comboCount += variants.length;
            variants.forEach((variant) => {
                splitSize(variant.size).forEach((size) => sizes.add(size));
                minPrice = Math.min(minPrice, variant.price);
                maxPrice = Math.max(maxPrice, variant.price);
            });
        });

        return {
            categories: productCount > 0 ? [{ ...DEFAULT_CATEGORY, count: productCount }] : [],
            sizes: sortSizes(sizes),
            priceRange: productCount > 0 ? { min: minPrice, max: maxPrice } : { min: 0, max: 0 },
            comboCount
        };
    }

    async getProductById(productId) {
        const product = await productRepository.findActiveById(productId);
        const variants = product ? product.variants.filter((variant) => variant.isActive) : [];

        if (!product || variants.length === 0) {
            throw notFoundError();
        }

        return {
            _id: product._id,
            name: product.name,
            description: product.description,
            category: DEFAULT_CATEGORY.value,
            isCombo: isComboName(product.name),
            isNew: isNewProduct(product.createdAt),
            createdAt: product.createdAt,
            variants: variants.map((variant) => ({
                _id: variant._id,
                name: variant.name,
                size: variant.size,
                price: variant.price,
                stock: variant.stock,
                images: variant.images.map((image) => image.url)
            }))
        };
    }

    // Same kind (combo or not) first, newest first, topped up with the other kind; never the product itself
    async getSimilarProducts(productId, limit) {
        const product = await productRepository.findActiveById(productId);
        if (!product) {
            throw notFoundError();
        }

        const excludeProduct = { _id: { $ne: new Types.ObjectId(productId) } };
        const isCombo = isComboName(product.name);
        const sameKind = isCombo ? COMBO_PATTERN : { $not: COMBO_PATTERN };
        const otherKind = isCombo ? { $not: COMBO_PATTERN } : COMBO_PATTERN;

        const similar = await productRepository.findActiveProductsPaginated({
            match: { ...excludeProduct, name: sameKind },
            sort: SORT_OPTIONS.newest,
            page: 1,
            limit
        });
        let items = similar.data;

        if (items.length < limit) {
            const others = await productRepository.findActiveProductsPaginated({
                match: { ...excludeProduct, name: otherKind },
                sort: SORT_OPTIONS.newest,
                page: 1,
                limit: limit - items.length
            });
            items = items.concat(others.data);
        }

        return items.map(toCardItem);
    }

    // List-card shape for one product document (e.g. a wishlist entry). Shows `preferredVariantId` while it's active,
    // else the first in-stock variant. An inactive product, or one with no active variant, comes back with
    // `isAvailable: false`, built from all its variants so the card can still show a name and image
    // (a product deleted from the DB is just `{ _id }`: no name, no image).
    buildProductCard(product, preferredVariantId) {
        const allVariants = product.variants || [];
        const activeVariants = product.isActive ? allVariants.filter((variant) => variant.isActive) : [];
        const isAvailable = activeVariants.length > 0;
        const variants = isAvailable ? activeVariants : allVariants;
        const prices = variants.map((variant) => variant.price);
        const defaultVariant = variants.find((variant) => String(variant._id) === String(preferredVariantId)) ||
            variants.find((variant) => variant.stock > 0) ||
            variants[0] || { images: [] };

        return {
            ...toCardItem({
                _id: product._id,
                name: product.name,
                createdAt: product.createdAt,
                minPrice: prices.length > 0 ? Math.min(...prices) : 0,
                maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
                sizes: variants.map((variant) => variant.size),
                inStock: isAvailable && defaultVariant.stock > 0,
                defaultVariant: {
                    _id: defaultVariant._id,
                    name: defaultVariant.name,
                    size: defaultVariant.size,
                    price: defaultVariant.price,
                    stock: defaultVariant.stock,
                    images: defaultVariant.images.slice(0, 2).map((image) => image.url)
                }
            }),
            isAvailable
        };
    }
}

module.exports = new ProductsService();
