const walletService = require('../../../services/user/wallet/wallet.service');
const paymentService = require('../../../services/user/payment/payment.service');

// Balance and history are read-only; money arrives only through refunds and verified Razorpay top-ups
class WalletController {
    async getWallet(req, res) {
        try {
            const wallet = await walletService.getWallet(req.user.userId);
            return res.status(200).json({
                success: true,
                message: 'Wallet retrieved successfully',
                data: wallet
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    // Starts a top-up: a Razorpay order for the amount (rupees). The wallet is credited only after verification.
    async startTopup(req, res) {
        try {
            const result = await paymentService.startWalletTopup(req.user.userId, req.body.amount);
            return res.status(201).json({
                success: true,
                message: 'Complete the payment to add money',
                data: result
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async getTransactions(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const type = req.query.type || '';

            const result = await walletService.getTransactions(req.user.userId, { page, limit, type });
            return res.status(200).json({
                success: true,
                message: 'Wallet transactions retrieved successfully',
                data: result.data,
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages
                }
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }
}

module.exports = new WalletController();
