const express = require('express');
const router = express.Router();
const adminProductController = require('../../controllers/admin/product/admin.product.controller');
const upload = require('../../middlewares/upload.middleware');

// GET all products
router.get('/', (req, res) => adminProductController.getAllProducts(req, res));

// POST create product (with dynamic variant images)
router.post('/', upload.any(), (req, res) => adminProductController.createProduct(req, res));

// PATCH update product status
router.patch('/:id/status', (req, res) => adminProductController.updateProductStatus(req, res));

// PUT update variant
router.put('/:id/variants/:variantId', upload.any(), (req, res) => adminProductController.updateVariant(req, res));

module.exports = router;
