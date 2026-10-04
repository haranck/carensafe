const cartService = require('../../../services/user/cart/cart.service');

class CartController {
    async getCart(req, res) {
        try {
            const cart = await cartService.getCart(req.user.userId);
            return res.status(200).json({
                success: true,
                message: 'Cart retrieved successfully',
                data: cart
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async getCount(req, res) {
        try {
            const count = await cartService.getCount(req.user.userId);
            return res.status(200).json({
                success: true,
                message: 'Cart count retrieved successfully',
                data: { count }
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async getRecommendations(req, res) {
        try {
            const products = await cartService.getRecommendations(req.user.userId);
            return res.status(200).json({
                success: true,
                message: 'Recommendations retrieved successfully',
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

    async addItem(req, res) {
        try {
            const { productId, variantId, quantity } = req.body;
            const result = await cartService.addItem(req.user.userId, productId, variantId, quantity);
            return res.status(201).json({
                success: true,
                message: 'Added to cart',
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

    async updateItem(req, res) {
        try {
            const cart = await cartService.updateQuantity(req.user.userId, req.params.itemId, req.body.quantity);
            return res.status(200).json({
                success: true,
                message: 'Cart updated',
                data: cart
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async removeItem(req, res) {
        try {
            const cart = await cartService.removeItem(req.user.userId, req.params.itemId);
            return res.status(200).json({
                success: true,
                message: 'Removed from cart',
                data: cart
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async clearCart(req, res) {
        try {
            const cart = await cartService.clearCart(req.user.userId);
            return res.status(200).json({
                success: true,
                message: 'Cart cleared',
                data: cart
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async moveToWishlist(req, res) {
        try {
            const cart = await cartService.moveToWishlist(req.user.userId, req.params.itemId);
            return res.status(200).json({
                success: true,
                message: 'Moved to wishlist',
                data: cart
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

module.exports = new CartController();
