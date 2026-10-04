const express = require('express');
const router = express.Router();
const wishlistController = require('../../../controllers/user/wishlist/wishlist.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const {
    validateAddToWishlist,
    validateWishlistProductId,
    validateWishlistQuery,
    validateMoveToCart
} = require('../../../middlewares/wishlist.validation');

// Every wishlist endpoint belongs to the logged-in user (req.user.userId)
router.get('/', authMiddleware, validateWishlistQuery, (req, res) => wishlistController.getWishlist(req, res));
router.get('/ids', authMiddleware, (req, res) => wishlistController.getWishlistIds(req, res));
router.post('/', authMiddleware, validateAddToWishlist, (req, res) => wishlistController.addToWishlist(req, res));
router.delete('/:productId', authMiddleware, validateWishlistProductId, (req, res) =>
    wishlistController.removeFromWishlist(req, res)
);
router.post('/:productId/move-to-cart', authMiddleware, validateWishlistProductId, validateMoveToCart, (req, res) =>
    wishlistController.moveToCart(req, res)
);

module.exports = router;
