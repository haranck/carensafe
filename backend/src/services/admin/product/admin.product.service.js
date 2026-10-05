const productRepository = require('../../../repositories/user/product.repository');

class AdminProductService {
    async createProduct(productData, files, variants) {
        const { name, description } = productData;
        
        const mappedVariants = variants.map((v, index) => {
            const variantImages = files.filter(f => f.fieldname === `images_${index}`).map(file => ({
                url: file.path,
                publicId: file.filename
            }));

            // The variant name is explicitly requested to be OriginalName + VariantName
            const fullVariantName = `${name} ${v.variantName}`.trim();

            return {
                name: fullVariantName,
                size: v.size,
                price: Number(v.price),
                stock: Number(v.stock) || 0,
                images: variantImages
            };
        });

        const newProduct = {
            name,
            description,
            variants: mappedVariants
        };

        return await productRepository.create(newProduct);
    }

    async getAllProducts(page, limit, search) {
        const filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { 'variants.name': { $regex: search, $options: 'i' } }
            ];
        }
        return await productRepository.findAll(filter, page, limit);
    }
    async updateProductStatus(productId, isActive) {
        const product = await productRepository.updateStatus(productId, isActive);
        if (!product) {
            const error = new Error('Product not found');
            error.statusCode = 404;
            throw error;
        }
        return product;
    }

    async updateVariant(productId, variantId, variantData, files) {
        const product = await productRepository.findById(productId);
        if (!product) {
            const error = new Error('Product not found');
            error.statusCode = 404;
            throw error;
        }
        
        const variant = product.variants.find(v => v._id.toString() === variantId);
        if (!variant) {
            const error = new Error('Variant not found');
            error.statusCode = 404;
            throw error;
        }

        let finalImages = variant.images;
        
        if (variantData.existingImages !== undefined) {
            // Keep only those images that are in existingImages array
            finalImages = variant.images.filter(img => 
                variantData.existingImages.some(eImg => eImg.url === img.url || eImg.publicId === img.publicId)
            );
        }

        if (files && files.length > 0) {
            const newImages = files.map(file => ({
                url: file.path,
                publicId: file.filename
            }));
            finalImages = [...finalImages, ...newImages];
        }

        if (variantData.existingImages !== undefined || (files && files.length > 0)) {
            variantData.images = finalImages;
        }
        delete variantData.existingImages;

        const updatedProduct = await productRepository.updateVariant(productId, variantId, variantData);
        return updatedProduct;
    }
}

module.exports = new AdminProductService();
