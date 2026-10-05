const express = require('express');
const router = express.Router();
const walletController = require('../../../controllers/user/wallet/wallet.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const { validateTransactionsQuery, validateTopup } = require('../../../middlewares/wallet.validation');
const { paymentRateLimiter } = require('../../../middlewares/rateLimit.middleware');

// The logged-in user's own wallet (req.user.userId). Top-ups are credited only after the Razorpay payment is verified.
router.get('/', authMiddleware, (req, res) => walletController.getWallet(req, res));
router.post('/topup', authMiddleware, paymentRateLimiter, validateTopup, (req, res) => walletController.startTopup(req, res));
router.get('/transactions', authMiddleware, validateTransactionsQuery, (req, res) => walletController.getTransactions(req, res));

module.exports = router;
