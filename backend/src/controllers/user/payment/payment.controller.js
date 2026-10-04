const paymentService = require('../../../services/user/payment/payment.service');

const fail = (res, error) => {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
        success: false,
        message: error.message || 'Internal Server Error'
    });
};

class PaymentController {
    // Razorpay checkout success handler → verify and apply (order or wallet top-up)
    async verify(req, res) {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
            const result = await paymentService.verifyPayment(req.user.userId, { razorpay_order_id, razorpay_payment_id, razorpay_signature });
            return res.status(200).json({ success: true, message: 'Payment confirmed', data: result });
        } catch (error) {
            return fail(res, error);
        }
    }

    // Razorpay popup payment.failed → the attempt is recorded; nothing is cancelled
    async failed(req, res) {
        try {
            const { razorpay_order_id, error } = req.body;
            const result = await paymentService.recordFailure(req.user.userId, { razorpay_order_id, error });
            return res.status(200).json({ success: true, message: 'Payment attempt recorded', data: result });
        } catch (error) {
            return fail(res, error);
        }
    }

    // Razorpay webhook: req.body is the RAW buffer (signature check needs the exact bytes)
    async webhook(req, res) {
        try {
            const result = await paymentService.handleWebhook(req.body, req.get('x-razorpay-signature'), req.get('x-razorpay-event-id'));
            return res.status(200).json({ success: true, message: 'Webhook processed', data: result });
        } catch (error) {
            return fail(res, error);
        }
    }
}

module.exports = new PaymentController();
