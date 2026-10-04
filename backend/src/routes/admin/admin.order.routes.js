const express = require('express');
const router = express.Router();
const adminOrderController = require('../../controllers/admin/order/admin.order.controller');
const adminAuthMiddleware = require('../../middlewares/adminAuth.middleware');
const { validateOrderParams } = require('../../middlewares/order.validation');
const {
    validateListOrdersQuery,
    validateReturnsQuery,
    validateUpdateStatus,
    validateAdminCancel,
    validateDecideReturn
} = require('../../middlewares/admin.order.validation');

// Every route here needs an admin login (checked before any upload or validation runs)
router.use(adminAuthMiddleware);

router.get('/', validateListOrdersQuery, (req, res) => adminOrderController.getAllOrders(req, res));
router.get('/stats', (req, res) => adminOrderController.getStats(req, res));
router.get('/returns', validateReturnsQuery, (req, res) => adminOrderController.getReturnItems(req, res));
router.get('/:id', validateOrderParams, (req, res) => adminOrderController.getOrder(req, res));
router.patch('/:id/status', validateOrderParams, validateUpdateStatus, (req, res) => adminOrderController.updateStatus(req, res));
router.post('/:id/cancel', validateOrderParams, validateAdminCancel, (req, res) => adminOrderController.cancelOrder(req, res));
router.patch('/:id/items/:itemId/return', validateOrderParams, validateDecideReturn, (req, res) =>
    adminOrderController.decideReturn(req, res)
);
router.patch('/:id/items/:itemId/return/received', validateOrderParams, (req, res) =>
    adminOrderController.markReturnReceived(req, res)
);

module.exports = router;
