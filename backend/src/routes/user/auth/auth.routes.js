const express = require('express');
const router = express.Router();
const authController = require('../../../controllers/user/auth/auth.controller');
const {
    validateSignup,
    validateLogin,
    validateGoogleAuth,
    validateForgotPassword,
    validateVerifyResetOtp,
    validateResetPassword
} = require('../../../middlewares/auth.validation');

router.post('/signup', validateSignup, (req, res) => authController.signup(req, res));
router.post('/verify-otp', (req, res) => authController.verifyOtp(req, res));
router.post('/resend-otp', (req, res) => authController.resendOtp(req, res));
router.post('/login', validateLogin, (req, res) => authController.login(req, res));
router.post('/google', validateGoogleAuth, (req, res) => authController.googleLogin(req, res));
// Forgot password: email → code → one-time reset token → new password
router.post('/forgot-password', validateForgotPassword, (req, res) => authController.forgotPassword(req, res));
router.post('/verify-reset-otp', validateVerifyResetOtp, (req, res) => authController.verifyResetOtp(req, res));
router.post('/reset-password', validateResetPassword, (req, res) => authController.resetPassword(req, res));
router.post('/refresh', (req, res) => authController.refresh(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));

module.exports = router;
