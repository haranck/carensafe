const express = require('express');
const router = express.Router();
const adminUserController = require('../../controllers/admin/user/admin.user.controller');
const upload = require('../../middlewares/upload.middleware');

router.get('/', (req, res) => adminUserController.getAllUsers(req, res));
router.get('/partners', (req, res) => adminUserController.getPartners(req, res));
router.post('/partner', upload.single('avatar'), (req, res) => adminUserController.createPartner(req, res));
router.put('/:userId', upload.single('avatar'), (req, res) => adminUserController.updatePartner(req, res));
router.get('/role/:role', (req, res) => adminUserController.getUsersByRole(req, res));
router.patch('/:userId/block', (req, res) => adminUserController.blockUser(req, res));
router.patch('/:userId/unblock', (req, res) => adminUserController.unblockUser(req, res));

module.exports = router;
