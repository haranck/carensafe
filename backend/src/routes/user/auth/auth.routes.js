const express = require('express');
const router = express.Router();
const authController = require('../../../controllers/user/auth/auth.controller');
const {
    validateSignup,
    validateLogin,
    validateGoogleAuth,
    validateForgotPassword,
    validateVerifyResetOtp,
    validateResetPassword,
    validateVerifyOtp,
    validateResendOtp
} = require('../../../middlewares/auth.validation');
const { authRateLimiter, otpSendRateLimiter, otpVerifyRateLimiter } = require('../../../middlewares/rateLimit.middleware');

// Rate limits run first, so malformed requests count too
router.post('/signup', otpSendRateLimiter, validateSignup, (req, res) => authController.signup(req, res));
router.post('/verify-otp', otpVerifyRateLimiter, validateVerifyOtp, (req, res) => authController.verifyOtp(req, res));
router.post('/resend-otp', otpSendRateLimiter, validateResendOtp, (req, res) => authController.resendOtp(req, res));
router.post('/login', authRateLimiter, validateLogin, (req, res) => authController.login(req, res));
router.post('/google', authRateLimiter, validateGoogleAuth, (req, res) => authController.googleLogin(req, res));
// Forgot password: email → code → one-time reset token → new password
router.post('/forgot-password', otpSendRateLimiter, validateForgotPassword, (req, res) => authController.forgotPassword(req, res));
router.post('/verify-reset-otp', otpVerifyRateLimiter, validateVerifyResetOtp, (req, res) => authController.verifyResetOtp(req, res));
router.post('/reset-password', validateResetPassword, (req, res) => authController.resetPassword(req, res));
router.post('/refresh', (req, res) => authController.refresh(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));

module.exports = router;
