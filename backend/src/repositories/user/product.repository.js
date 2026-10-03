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

    async findActiveProductsPaginated({ match = {}, variantFilter = true, sort = { createdAt: -1, _id: 1 }, page = 1, limit = 12 }) {
        const skip = (page - 1) * limit;
        const [result] = await Product.aggregate([
            { $match: { isActive: true, ...match } },
            {
                $addFields: {
                    activeVariants: { $filter: { input: '$variants', as: 'v', cond: { $eq: ['$$v.isActive', true] } } }
                }
            },
            {
                $addFields: {
                    matchingVariants: { $filter: { input: '$activeVariants', as: 'v', cond: variantFilter } }
                }
            },
            { $match: { 'matchingVariants.0': { $exists: true } } },
            {
                $addFields: {
                    inStockVariants: { $filter: { input: '$matchingVariants', as: 'v', cond: { $gt: ['$$v.stock', 0] } } }
                }
            },
            {
                $project: {
                    name: 1,
                    createdAt: 1,
                    minPrice: { $min: '$matchingVariants.price' },
                    maxPrice: { $max: '$matchingVariants.price' },
                    sizes: '$activeVariants.size',
                    inStock: { $gt: [{ $size: '$inStockVariants' }, 0] },
                    // First in-stock matching variant, else the first matching one
                    defaultVariant: {
                        $let: {
                            vars: { dv: { $arrayElemAt: [{ $concatArrays: ['$inStockVariants', '$matchingVariants'] }, 0] } },
                            in: {
                                _id: '$$dv._id',
                                name: '$$dv.name',
                                size: '$$dv.size',
                                price: '$$dv.price',
                                stock: '$$dv.stock',
                                images: { $slice: ['$$dv.images.url', 2] }
                            }
                        }
                    }
                }
            },
            { $sort: sort },
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
