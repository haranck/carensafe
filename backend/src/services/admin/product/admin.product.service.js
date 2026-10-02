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
}

module.exports = new AdminProductService();
