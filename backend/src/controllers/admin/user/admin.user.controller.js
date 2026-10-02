const adminUserService = require('../../../services/admin/user/admin.user.service');

class AdminUserController {
    async getAllUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || '';

            const users = await adminUserService.getAllUsers(page, limit, search);
            return res.status(200).json({
                success: true,
                message: 'Users retrieved successfully',
                data: users.data,
                pagination: {
                    total: users.total,
                    page: users.page,
                    limit: users.limit,
                    totalPages: users.totalPages
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

    async getPartners(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || '';

            const partners = await adminUserService.getPartners(page, limit, search);
            return res.status(200).json({
                success: true,
                message: 'Partners retrieved successfully',
                data: partners.data,
                pagination: {
                    total: partners.total,
                    page: partners.page,
                    limit: partners.limit,
                    totalPages: partners.totalPages
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

    async createPartner(req, res) {
        try {
            const partnerData = req.body;
            if (req.file) {
                partnerData.avatarUrl = req.file.path;
            }
            const newPartner = await adminUserService.createPartner(partnerData);
            return res.status(201).json({
                success: true,
                message: 'Partner created successfully',
                data: newPartner
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async getUsersByRole(req, res) {
        try {
            const { role } = req.params;
            const users = await adminUserService.getUsersByRole(role);
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

    async updatePartner(req, res) {
        try {
            const { userId } = req.params;
            const partnerData = req.body;
            if (req.file) {
                partnerData.avatarUrl = req.file.path;
            }
            const updatedPartner = await adminUserService.updatePartner(userId, partnerData);
            return res.status(200).json({
                success: true,
                message: 'Partner updated successfully',
                data: updatedPartner
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
