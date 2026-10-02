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
