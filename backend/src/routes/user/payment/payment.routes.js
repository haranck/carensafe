const express = require('express');
const router = express.Router();
const paymentController = require('../../../controllers/user/payment/payment.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const { paymentRateLimiter } = require('../../../middlewares/rateLimit.middleware');
const { validateVerifyPayment, validatePaymentFailed } = require('../../../middlewares/payment.validation');

// The logged-in user's own payments (another user's Razorpay order is a 404)
router.post('/verify', authMiddleware, paymentRateLimiter, validateVerifyPayment, (req, res) => paymentController.verify(req, res));
router.post('/failed', authMiddleware, paymentRateLimiter, validatePaymentFailed, (req, res) => paymentController.failed(req, res));

module.exports = router;
