const express = require('express');
const router = express.Router();
const productsController = require('../../../controllers/user/products/products.controller');
const { validateProductQuery, validateProductId } = require('../../../middlewares/products.validation');

// Public storefront endpoints (no auth)
router.get('/', validateProductQuery, (req, res) => productsController.getProducts(req, res));
router.get('/:id', validateProductId, (req, res) => productsController.getProductById(req, res));

module.exports = router;
