const express = require('express');
const router = express.Router();
const wishlistController = require('../../../controllers/user/wishlist/wishlist.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const {
    validateAddToWishlist,
    validateWishlistItemId,
    validateWishlistQuery
} = require('../../../middlewares/wishlist.validation');

// Every wishlist endpoint belongs to the logged-in user (req.user.userId). Items are per variant (size).
router.get('/', authMiddleware, validateWishlistQuery, (req, res) => wishlistController.getWishlist(req, res));
router.get('/ids', authMiddleware, (req, res) => wishlistController.getWishlistIds(req, res));
router.post('/', authMiddleware, validateAddToWishlist, (req, res) => wishlistController.addToWishlist(req, res));
router.delete('/items/:itemId', authMiddleware, validateWishlistItemId, (req, res) => wishlistController.removeItem(req, res));
router.post('/items/:itemId/move-to-cart', authMiddleware, validateWishlistItemId, (req, res) =>
    wishlistController.moveToCart(req, res)
);

module.exports = router;
