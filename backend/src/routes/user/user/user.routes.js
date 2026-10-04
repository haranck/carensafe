const express = require('express');
const router = express.Router();
const userController = require('../../../controllers/user/user/user.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const { avatarUpload } = require('../../../middlewares/upload.middleware');
const {
    validateUpdateProfile,
    validateEmailChange,
    validateEmailVerify
} = require('../../../middlewares/profile.validation');

// Mounted at /api/user/profile; every endpoint is the logged-in user's own profile (req.user.userId)
router.get('/', authMiddleware, (req, res) => userController.getProfile(req, res));
router.patch('/', authMiddleware, validateUpdateProfile, (req, res) => userController.updateProfile(req, res));
// authMiddleware first, so nothing is uploaded for unauthenticated requests
router.patch('/avatar', authMiddleware, avatarUpload.single('avatar'), (req, res) => userController.updateAvatar(req, res));
router.post('/email/request-otp', authMiddleware, validateEmailChange, (req, res) => userController.requestEmailChange(req, res));
router.post('/email/verify', authMiddleware, validateEmailVerify, (req, res) => userController.verifyEmailChange(req, res));

module.exports = router;
