const walletService = require('../../../services/user/wallet/wallet.service');

// Read-only: no endpoint can add money to a wallet (only order refunds on the server do)
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
