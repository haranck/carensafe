const wishlistService = require('../../../services/user/wishlist/wishlist.service');
const cartService = require('../../../services/user/cart/cart.service');

const DEFAULT_LIMIT = 12;

class WishlistController {
    async getWishlist(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || DEFAULT_LIMIT;

            const wishlist = await wishlistService.getWishlist(req.user.userId, page, limit);
            return res.status(200).json({
                success: true,
                message: 'Wishlist retrieved successfully',
                data: wishlist.data,
                pagination: {
                    total: wishlist.total,
                    page: wishlist.page,
                    limit: wishlist.limit,
                    totalPages: wishlist.totalPages
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

    async getWishlistIds(req, res) {
        try {
            const productIds = await wishlistService.getWishlistProductIds(req.user.userId);
            return res.status(200).json({
                success: true,
                message: 'Wishlist ids retrieved successfully',
                data: productIds
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async addToWishlist(req, res) {
        try {
            const { productId, variantId } = req.body;
            const item = await wishlistService.addToWishlist(req.user.userId, productId, variantId);
            return res.status(201).json({
                success: true,
                message: 'Product added to wishlist',
                data: item
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async removeFromWishlist(req, res) {
        try {
            await wishlistService.removeFromWishlist(req.user.userId, req.params.productId);
            return res.status(200).json({
                success: true,
                message: 'Product removed from wishlist',
                data: { productId: req.params.productId }
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    // Adds one to the cart, then removes the product from the wishlist
    async moveToCart(req, res) {
        try {
            const result = await cartService.moveFromWishlist(req.user.userId, req.params.productId, req.body.variantId);
            return res.status(200).json({
                success: true,
                message: 'Moved to cart',
                data: result
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

module.exports = new WishlistController();
