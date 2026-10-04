const express = require('express');
const router = express.Router();
const adminUserController = require('../../controllers/admin/user/admin.user.controller');

router.get('/', (req, res) => adminUserController.getAllUsers(req, res));
router.patch('/:userId/block', (req, res) => adminUserController.blockUser(req, res));
router.patch('/:userId/unblock', (req, res) => adminUserController.unblockUser(req, res));

module.exports = router;
