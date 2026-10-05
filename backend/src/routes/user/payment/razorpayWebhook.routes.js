const express = require('express');
const router = express.Router();
const paymentController = require('../../../controllers/user/payment/payment.controller');

// Mounted in app.js BEFORE express.json(): the signature is checked against the raw body. No auth (Razorpay calls it);
// the HMAC signature is the authentication.
router.post('/', express.raw({ type: 'application/json', limit: '1mb' }), (req, res) => paymentController.webhook(req, res));

module.exports = router;
