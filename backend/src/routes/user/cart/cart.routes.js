const express = require('express');
const router = express.Router();
const cartController = require('../../../controllers/user/cart/cart.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const {
    validateAddCartItem,
    validateUpdateCartItem,
    validateCartItemId
} = require('../../../middlewares/cart.validation');

// Every cart endpoint belongs to the logged-in user (req.user.userId)
router.get('/', authMiddleware, (req, res) => cartController.getCart(req, res));
router.get('/count', authMiddleware, (req, res) => cartController.getCount(req, res));
router.get('/recommendations', authMiddleware, (req, res) => cartController.getRecommendations(req, res));
router.post('/items', authMiddleware, validateAddCartItem, (req, res) => cartController.addItem(req, res));
router.patch('/items/:itemId', authMiddleware, validateCartItemId, validateUpdateCartItem, (req, res) =>
    cartController.updateItem(req, res)
);
router.delete('/items/:itemId', authMiddleware, validateCartItemId, (req, res) => cartController.removeItem(req, res));
router.post('/items/:itemId/move-to-wishlist', authMiddleware, validateCartItemId, (req, res) =>
    cartController.moveToWishlist(req, res)
);
router.delete('/', authMiddleware, (req, res) => cartController.clearCart(req, res));

module.exports = router;
