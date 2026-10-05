const express = require('express');
const router = express.Router();
const productsController = require('../../../controllers/user/products/products.controller');
const {
    validateProductQuery,
    validateProductId,
    validateSimilarQuery
} = require('../../../middlewares/products.validation');

// Public storefront endpoints (no auth)
router.get('/', validateProductQuery, (req, res) => productsController.getProducts(req, res));
// Before '/:id' so "filters" isn't treated as a product id
router.get('/filters', (req, res) => productsController.getFilters(req, res));
router.get('/:id/similar', validateProductId, validateSimilarQuery, (req, res) =>
    productsController.getSimilarProducts(req, res)
);
router.get('/:id', validateProductId, (req, res) => productsController.getProductById(req, res));

module.exports = router;
