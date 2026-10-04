const express = require('express');
const router = express.Router();
const walletController = require('../../../controllers/user/wallet/wallet.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const { validateTransactionsQuery } = require('../../../middlewares/wallet.validation');

// The logged-in user's own wallet (req.user.userId). Read-only; "Add money" has no endpoint yet.
router.get('/', authMiddleware, (req, res) => walletController.getWallet(req, res));
router.get('/transactions', authMiddleware, validateTransactionsQuery, (req, res) => walletController.getTransactions(req, res));

module.exports = router;
