const productsService = require('../../../services/user/products/products.service');

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 48;
const DEFAULT_SIMILAR_LIMIT = 8;

// "true" / "false" query flags (already validated); undefined when absent
const parseFlag = (value) => (value === undefined ? undefined : value === 'true');
const parseNumber = (value) => (value === undefined ? undefined : Number(value));

class ProductsController {
    async getProducts(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
            const search = (req.query.search || '').trim();
            const { category, sort } = req.query;
            const sizes = req.query.sizes ? req.query.sizes.split(',') : [];

            const products = await productsService.getProducts({
                page,
                limit,
                search,
                category,
                combo: parseFlag(req.query.combo),
                sizes,
                minPrice: parseNumber(req.query.minPrice),
                maxPrice: parseNumber(req.query.maxPrice),
                inStock: parseFlag(req.query.inStock) === true,
                sort
            });
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

    async getFilters(req, res) {
        try {
            const filters = await productsService.getFilterOptions();
            return res.status(200).json({
                success: true,
                message: 'Product filters retrieved successfully',
                data: filters
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async getSimilarProducts(req, res) {
        try {
            const limit = parseInt(req.query.limit) || DEFAULT_SIMILAR_LIMIT;
            const products = await productsService.getSimilarProducts(req.params.id, limit);
            return res.status(200).json({
                success: true,
                message: 'Similar products retrieved successfully',
                data: products
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
