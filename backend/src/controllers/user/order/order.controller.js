const orderService = require('../../../services/user/order/order.service');

const fail = (res, error) => {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
        success: false,
        message: error.message || 'Internal Server Error'
    });
};

class OrderController {
    async placeOrder(req, res) {
        try {
            const { addressId, paymentMethod } = req.body;
            const order = await orderService.placeOrder(req.user.userId, { addressId, paymentMethod });
            return res.status(201).json({
                success: true,
                message: 'Order placed',
                data: order
            });
        } catch (error) {
            return fail(res, error);
        }
    }

    async getMyOrders(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const status = req.query.status || '';

            const result = await orderService.getMyOrders(req.user.userId, { page, limit, status });
            return res.status(200).json({
                success: true,
                message: 'Orders retrieved successfully',
                data: result.data,
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages
                }
            });
        } catch (error) {
            return fail(res, error);
        }
    }

    async getMyOrder(req, res) {
        try {
            const order = await orderService.getMyOrder(req.user.userId, req.params.id);
            return res.status(200).json({
                success: true,
                message: 'Order retrieved successfully',
                data: order
            });
        } catch (error) {
            return fail(res, error);
        }
    }

    // Whole order (no itemId) or one item
    async cancel(req, res) {
        try {
            const { reason, note } = req.body;
            const itemId = req.params.itemId || null;
            const order = await orderService.cancelMyOrder(req.user.userId, req.params.id, itemId, { reason, note });
            return res.status(200).json({
                success: true,
                message: itemId ? 'Item cancelled' : 'Order cancelled',
                data: order
            });
        } catch (error) {
            return fail(res, error);
        }
    }

    // Whole order (no itemId) or one item
    async requestReturn(req, res) {
        try {
            const { note, packUnopenedConfirmed } = req.body;
            const itemId = req.params.itemId || null;
            const order = await orderService.requestReturn(req.user.userId, req.params.id, itemId, { note, packUnopenedConfirmed });
            return res.status(200).json({
                success: true,
                message: 'Return requested',
                data: order
            });
        } catch (error) {
            return fail(res, error);
        }
    }
}

module.exports = new OrderController();
