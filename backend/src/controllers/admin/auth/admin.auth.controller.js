const adminAuthService = require('../../../services/admin/auth/admin.auth.service');

class AdminAuthController {
    async adminLogin(req, res) {
        try {
            const { email, password } = req.body;
            const data = await adminAuthService.adminLogin({ email, password });

            return res.status(200).json({
                success: true,
                message: 'Admin login successful',
                data
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

module.exports = new AdminAuthController();
