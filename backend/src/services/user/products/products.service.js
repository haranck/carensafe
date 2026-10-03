const productRepository = require('../../../repositories/user/product.repository');

// TODO: replace name matching with a real `category` field on the product model
const COMBO_PATTERN = /combo/i;
const NEW_PRODUCT_MS = 30 * 24 * 60 * 60 * 1000;

const SORT_OPTIONS = {
    newest: { createdAt: -1, _id: 1 },
    price_asc: { price: 1, _id: 1 },
    price_desc: { price: -1, _id: 1 }
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class ProductsService {
    async getProducts({ page, limit, search, category, sort }) {
        const filter = {};

        if (category === 'combo_packs') {
            filter.productName = COMBO_PATTERN;
        } else if (category === 'sanitary_pads') {
            filter.productName = { $not: COMBO_PATTERN };
        }

        if (search) {
            const pattern = new RegExp(escapeRegex(search), 'i');
            filter.$or = [{ name: pattern }, { productName: pattern }];
        }

        const result = await productRepository.findActiveVariantsPaginated(
            filter,
            SORT_OPTIONS[sort] || SORT_OPTIONS.newest,
            page,
            limit
        );

        const now = Date.now();
        result.data = result.data.map((item) => ({
            ...item,
            category: COMBO_PATTERN.test(item.productName) ? 'combo_packs' : 'sanitary_pads',
            isNew: now - new Date(item.createdAt).getTime() < NEW_PRODUCT_MS
        }));

        return result;
    }

    async getProductById(productId) {
        const product = await productRepository.findActiveById(productId);
        const variants = product ? product.variants.filter((variant) => variant.isActive) : [];

        if (!product || variants.length === 0) {
            const error = new Error('Product not found');
            error.statusCode = 404;
            throw error;
        }

        return {
            _id: product._id,
            name: product.name,
            description: product.description,
            category: COMBO_PATTERN.test(product.name) ? 'combo_packs' : 'sanitary_pads',
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
}

module.exports = new ProductsService();
