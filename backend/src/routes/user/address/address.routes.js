const express = require('express');
const router = express.Router();
const addressController = require('../../../controllers/user/address/address.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const {
    validateCreateAddress,
    validateUpdateAddress,
    validateAddressId
} = require('../../../middlewares/address.validation');

// Every address endpoint belongs to the logged-in user (req.user.userId)
router.get('/', authMiddleware, (req, res) => addressController.getAddresses(req, res));
router.post('/', authMiddleware, validateCreateAddress, (req, res) => addressController.createAddress(req, res));
router.patch('/:id', authMiddleware, validateAddressId, validateUpdateAddress, (req, res) =>
    addressController.updateAddress(req, res)
);
router.delete('/:id', authMiddleware, validateAddressId, (req, res) => addressController.deleteAddress(req, res));
router.patch('/:id/default', authMiddleware, validateAddressId, (req, res) => addressController.setDefaultAddress(req, res));

module.exports = router;
