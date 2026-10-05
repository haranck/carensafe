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

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const tooMany = (message) => ({ success: false, message });

// "1.2.3.4:someone@email.com": one IP can't hammer one address, and one address isn't blocked for everyone
const ipAndEmailKey = (req) => `${ipKeyGenerator(req.ip)}:${String(req.body?.email || '').trim().toLowerCase()}`;

// Login / Google sign-in (customers and admins): 10 failed attempts per 15 minutes per IP (successful logins don't count)
const authRateLimiter = rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: 10,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => ipKeyGenerator(req.ip),
    message: tooMany('Too many login attempts. Please wait 15 minutes and try again.'),
    standardHeaders: true,
    legacyHeaders: false
});

// Anything that emails a code (signup, resend, forgot password): 5 per 15 minutes per IP + email
const otpSendRateLimiter = rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: 5,
    keyGenerator: ipAndEmailKey,
    message: tooMany('Too many codes requested. Please wait 15 minutes and try again.'),
    standardHeaders: true,
    legacyHeaders: false
});

// Code checks (signup, password reset): 10 per 15 minutes per IP + email (each code also allows only 3 wrong tries)
const otpVerifyRateLimiter = rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: 10,
    keyGenerator: ipAndEmailKey,
    message: tooMany('Too many attempts. Please wait 15 minutes and try again.'),
    standardHeaders: true,
    legacyHeaders: false
});

// Logged-in actions that check the current password: 5 failures per 15 minutes per user. Place after authMiddleware.
const passwordCheckRateLimiter = rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: 5,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => (req.user?.userId ? `user:${req.user.userId}` : ipKeyGenerator(req.ip)),
    message: tooMany('Too many incorrect password attempts. Please wait 15 minutes and try again.'),
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    globalRateLimiter,
    paymentRateLimiter,
    contactRateLimiter,
    authRateLimiter,
    otpSendRateLimiter,
    otpVerifyRateLimiter,
    passwordCheckRateLimiter
};
