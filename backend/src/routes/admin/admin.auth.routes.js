const express = require('express');
const router = express.Router();
const { validateLogin } = require('../../middlewares/auth.validation');
const adminAuthController = require('../../controllers/admin/auth/admin.auth.controller');

router.post('/login', validateLogin, (req, res) => adminAuthController.adminLogin(req, res));

module.exports = router;
