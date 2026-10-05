const express = require('express');
const router = express.Router();
const contactController = require('../../../controllers/user/contact/contact.controller');
const { contactRateLimiter } = require('../../../middlewares/rateLimit.middleware');
const { validateContactMessage } = require('../../../middlewares/contact.validation');

// Public: anyone can write to us (rate-limited per IP)
router.post('/', contactRateLimiter, validateContactMessage, (req, res) => contactController.submitMessage(req, res));

module.exports = router;
