const adminUserService = require('../../../services/admin/user/admin.user.service');

class AdminUserController {
    async getAllUsers(req, res) {
        try {
            const users = await adminUserService.getAllUsers();
            return res.status(200).json({
                success: true,
                message: 'Users retrieved successfully',
                data: users
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async blockUser(req, res) {
        try {
            const { userId } = req.params;
            const updatedUser = await adminUserService.blockUser(userId);

            return res.status(200).json({
                success: true,
                message: 'User blocked successfully',
                data: updatedUser
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async unblockUser(req, res) {
        try {
            const { userId } = req.params;
            const updatedUser = await adminUserService.unblockUser(userId);

            return res.status(200).json({
                success: true,
                message: 'User unblocked successfully',
                data: updatedUser
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

module.exports = new AdminUserController();
