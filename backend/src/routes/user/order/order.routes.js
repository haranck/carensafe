const express = require('express');
const router = express.Router();
const orderController = require('../../../controllers/user/order/order.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const {
    validatePlaceOrder,
    validateMyOrdersQuery,
    validateOrderParams,
    validateCancelOrder,
    validateReturnOrder
} = require('../../../middlewares/order.validation');

// Every order endpoint belongs to the logged-in user (req.user.userId); another user's order is a 404
router.post('/', authMiddleware, validatePlaceOrder, (req, res) => orderController.placeOrder(req, res));
router.get('/', authMiddleware, validateMyOrdersQuery, (req, res) => orderController.getMyOrders(req, res));
router.get('/:id', authMiddleware, validateOrderParams, (req, res) => orderController.getMyOrder(req, res));
router.post('/:id/cancel', authMiddleware, validateOrderParams, validateCancelOrder, (req, res) => orderController.cancel(req, res));
router.post('/:id/items/:itemId/cancel', authMiddleware, validateOrderParams, validateCancelOrder, (req, res) =>
    orderController.cancel(req, res)
);
router.post('/:id/return', authMiddleware, validateOrderParams, validateReturnOrder, (req, res) =>
    orderController.requestReturn(req, res)
);
router.post('/:id/items/:itemId/return', authMiddleware, validateOrderParams, validateReturnOrder, (req, res) =>
    orderController.requestReturn(req, res)
);

module.exports = router;
