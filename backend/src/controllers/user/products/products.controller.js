const productsService = require('../../../services/user/products/products.service');

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

class ProductsController {
    async getProducts(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
            const search = (req.query.search || '').trim();
            const { category, sort } = req.query;

            const products = await productsService.getProducts({ page, limit, search, category, sort });
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

    async getProductById(req, res) {
        try {
            const product = await productsService.getProductById(req.params.id);
            return res.status(200).json({
                success: true,
                message: 'Product retrieved successfully',
                data: product
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

module.exports = new ProductsController();
