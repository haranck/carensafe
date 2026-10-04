const express = require('express');
const router = express.Router();
const authController = require('../../../controllers/user/auth/auth.controller');
const { validateSignup, validateLogin, validateGoogleAuth } = require('../../../middlewares/auth.validation');

router.post('/signup', validateSignup, (req, res) => authController.signup(req, res));
router.post('/verify-otp', (req, res) => authController.verifyOtp(req, res));
router.post('/resend-otp', (req, res) => authController.resendOtp(req, res));
router.post('/login', validateLogin, (req, res) => authController.login(req, res));
router.post('/google', validateGoogleAuth, (req, res) => authController.googleLogin(req, res));
router.post('/refresh', (req, res) => authController.refresh(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));

module.exports = router;
