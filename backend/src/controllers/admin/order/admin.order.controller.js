const adminOrderService = require('../../../services/admin/order/admin.order.service');

const fail = (res, error) => {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
        success: false,
        message: error.message || 'Internal Server Error'
    });
};

const paginated = (res, message, result) =>
    res.status(200).json({
        success: true,
        message,
        data: result.data,
        pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages
        }
    });

class AdminOrderController {
    async getAllOrders(req, res) {
        try {
            const result = await adminOrderService.listOrders({
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                search: req.query.search || '',
                orderStatus: req.query.orderStatus || '',
                paymentStatus: req.query.paymentStatus || '',
                from: req.query.from || '',
                to: req.query.to || '',
                hasReturnRequest: req.query.hasReturnRequest === 'true'
            });
            return paginated(res, 'Orders retrieved successfully', result);
        } catch (error) {
            return fail(res, error);
        }
    }

    async getStats(req, res) {
        try {
            const stats = await adminOrderService.getStats();
            return res.status(200).json({ success: true, message: 'Order stats retrieved successfully', data: stats });
        } catch (error) {
            return fail(res, error);
        }
    }

    async getReturnItems(req, res) {
        try {
            const result = await adminOrderService.listReturnItems({
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10
            });
            return paginated(res, 'Return requests retrieved successfully', result);
        } catch (error) {
            return fail(res, error);
        }
    }

    async getOrder(req, res) {
        try {
            const order = await adminOrderService.getOrder(req.params.id);
            return res.status(200).json({ success: true, message: 'Order retrieved successfully', data: order });
        } catch (error) {
            return fail(res, error);
        }
    }

    async updateStatus(req, res) {
        try {
            const { status, note, courier, trackingNumber, trackingUrl, expectedDelivery } = req.body;
            const order = await adminOrderService.updateStatus(req.params.id, {
                status,
                note,
                courier,
                trackingNumber,
                trackingUrl,
                expectedDelivery
            });
            return res.status(200).json({ success: true, message: 'Order status updated', data: order });
        } catch (error) {
            return fail(res, error);
        }
    }

    async cancelOrder(req, res) {
        try {
            const { reason, note } = req.body;
            const order = await adminOrderService.cancelOrder(req.params.id, { reason, note });
            return res.status(200).json({ success: true, message: 'Order cancelled', data: order });
        } catch (error) {
            return fail(res, error);
        }
    }

    async decideReturn(req, res) {
        try {
            const { decision, adminReason } = req.body;
            const order = await adminOrderService.decideReturn(req.params.id, req.params.itemId, { decision, adminReason });
            return res.status(200).json({
                success: true,
                message: decision === 'approved' ? 'Return approved' : 'Return rejected',
                data: order
            });
        } catch (error) {
            return fail(res, error);
        }
    }

    async markReturnReceived(req, res) {
        try {
            const order = await adminOrderService.markReturnReceived(req.params.id, req.params.itemId);
            return res.status(200).json({ success: true, message: 'Return marked as received', data: order });
        } catch (error) {
            return fail(res, error);
        }
    }
}

module.exports = new AdminOrderController();
