const express = require('express');
const router = express.Router();
const { validateLogin } = require('../../middlewares/auth.validation');
const adminAuthController = require('../../controllers/admin/auth/admin.auth.controller');

// The only admin endpoints without adminAuthMiddleware (refresh / logout use the adminRefreshToken cookie)
router.post('/login', validateLogin, (req, res) => adminAuthController.adminLogin(req, res));
router.post('/refresh', (req, res) => adminAuthController.refresh(req, res));
router.post('/logout', (req, res) => adminAuthController.logout(req, res));

module.exports = router;
