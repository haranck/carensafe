const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later'
    },
    standardHeaders: true, 
    legacyHeaders: false, 
});

// Orders and payments: 20 requests a minute per logged-in user (per IP otherwise). Place after authMiddleware.
const paymentRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    keyGenerator: (req) => (req.user?.userId ? `user:${req.user.userId}` : ipKeyGenerator(req.ip)),
    message: {
        success: false,
        message: 'Too many attempts. Please wait a minute and try again.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Contact form (public): 5 messages per 15 minutes per IP
const contactRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    keyGenerator: (req) => ipKeyGenerator(req.ip),
    message: {
        success: false,
        message: "You've sent several messages already. Please wait a few minutes or call us."
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = { globalRateLimiter, paymentRateLimiter, contactRateLimiter };
