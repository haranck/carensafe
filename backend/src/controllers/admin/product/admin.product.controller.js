const adminProductService = require('../../../services/admin/product/admin.product.service');

class AdminProductController {
    async createProduct(req, res) {
        try {
            const { name, description } = req.body;
            let variants;

            try {
                variants = JSON.parse(req.body.variants);
            } catch (e) {
                console.log("Validation Failed: Invalid variants format", req.body.variants);
                return res.status(400).json({ success: false, message: 'Invalid variants format' });
            }
            
            if (!name || !description || !variants || variants.length === 0) {
                console.log("Validation Failed: Missing required fields");
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields (name, description, variants)'
                });
            }

            // Validate each variant and enforce max 3 images per variant
            for (let i = 0; i < variants.length; i++) {
                const v = variants[i];
                if (!v.variantName || !v.size || !v.price) {
                    console.log(`Validation Failed: Variant ${i} missing fields`);
                    return res.status(400).json({ success: false, message: 'Variant missing required fields (variantName, size, price)' });
                }

                // Count images for this specific variant
                const variantImages = req.files ? req.files.filter(f => f.fieldname === `images_${i}`) : [];
                if (variantImages.length === 0) {
                    console.log(`Validation Failed: No images for variant ${i}`);
                    return res.status(400).json({ success: false, message: `At least one image is required for variant: ${v.variantName}` });
                }
                if (variantImages.length > 3) {
                    console.log(`Validation Failed: Too many images for variant ${i}`);
                    return res.status(400).json({ success: false, message: `Maximum 3 images allowed per variant. Check variant: ${v.variantName}` });
                }
            }

            const newProduct = await adminProductService.createProduct(req.body, req.files, variants);

            return res.status(201).json({
                success: true,
                message: 'Product created successfully',
                data: newProduct
            });

        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async getAllProducts(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || '';

            const products = await adminProductService.getAllProducts(page, limit, search);
            
            return res.status(200).json({
                success: true,
                message: 'Products retrieved successfully',
                data: products.data,
                pagination: {
                    total: products.total,
                    page: products.page,
                    limit: products.limit,
                    totalPages: products.totalPages
                }
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }
}

module.exports = new AdminProductController();
