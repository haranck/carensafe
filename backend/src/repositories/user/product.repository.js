const Product = require('../../models/product.model');

class ProductRepository {
    create(productData) {
        return Product.create(productData);
    }

    findById(productId) {
        return Product.findById(productId);
    }

    async findAll(filter = {}, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Product.countDocuments(filter)
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    findActiveProducts() {
        // Find products where the product is active
        return Product.find({ isActive: true }).sort({ createdAt: -1 });
    }

    // One card per active variant that passes `variantFilter` (an expression on `$$v`), so every size/pack is
    // listed on its own with its own price, stock and images
    async findActiveProductsPaginated({ match = {}, variantFilter = true, sort = { createdAt: -1, _id: 1 }, page = 1, limit = 12 }) {
        const skip = (page - 1) * limit;
        const [result] = await Product.aggregate([
            { $match: { isActive: true, ...match } },
            { $unwind: '$variants' },
            { $match: { 'variants.isActive': true } },
            { $match: { $expr: { $let: { vars: { v: '$variants' }, in: variantFilter } } } },
            {
                $project: {
                    name: 1,
                    createdAt: 1,
                    minPrice: '$variants.price',
                    maxPrice: '$variants.price',
                    sizes: ['$variants.size'],
                    inStock: { $gt: ['$variants.stock', 0] },
                    defaultVariant: {
                        _id: '$variants._id',
                        name: '$variants.name',
                        size: '$variants.size',
                        price: '$variants.price',
                        stock: '$variants.stock',
                        images: { $slice: ['$variants.images.url', 2] }
                    }
                }
            },
            // Variants of one product share its _id: keep their order stable across pages
            { $sort: { ...sort, 'defaultVariant._id': 1 } },
            {
                $facet: {
                    data: [{ $skip: skip }, { $limit: limit }],
                    total: [{ $count: 'count' }]
                }
            }
        ]).collation({ locale: 'en', strength: 2 });
        const total = result.total[0]?.count || 0;
        return { data: result.data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // Only what the shop filter options need
    findActiveForFilters() {
        return Product.find({ isActive: true })
            .select('name variants.size variants.price variants.isActive')
            .lean();
    }

    // Newest active products with their variants (cart recommendations)
    findActiveNewest(limit) {
        return Product.find({ isActive: true })
            .sort({ createdAt: -1, _id: 1 })
            .limit(limit)
            .select('name isActive createdAt variants')
            .lean();
    }

    findActiveById(productId) {
        return Product.findOne({ _id: productId, isActive: true }).lean();
    }

    updateById(productId, updateData) {
        return Product.findByIdAndUpdate(
            productId, 
            updateData, 
            { returnDocument: 'after', runValidators: true }
        );
    }

    updateStatus(productId, isActive) {
        return Product.findByIdAndUpdate(
            productId, 
            { isActive }, 
            { returnDocument: 'after', runValidators: true }
        );
    }

    addVariant(productId, variantData) {
        return Product.findByIdAndUpdate(
            productId,
            { $push: { variants: variantData } },
            { returnDocument: 'after', runValidators: true }
        );
    }

    updateVariant(productId, variantId, variantData) {
        // Construct the update object dynamically for the specific variant
        const updateObj = {};
        for (const [key, value] of Object.entries(variantData)) {
            updateObj[`variants.$.${key}`] = value;
        }
        
        return Product.findOneAndUpdate(
            { _id: productId, 'variants._id': variantId },
            { $set: updateObj },
            { returnDocument: 'after', runValidators: true }
        );
    }

    updateVariantStatus(productId, variantId, isActive) {
        return Product.findOneAndUpdate(
            { _id: productId, 'variants._id': variantId },
            { $set: { 'variants.$.isActive': isActive } },
            { returnDocument: 'after', runValidators: true }
        );
    }

    deleteVariant(productId, variantId) {
        return Product.findByIdAndUpdate(
            productId,
            { $pull: { variants: { _id: variantId } } },
            { returnDocument: 'after' }
        );
    }

    deleteById(productId) {
        return Product.findByIdAndDelete(productId);
    }
}

module.exports = new ProductRepository();
