const userService = require('../../../services/user/user/user.service');

class UserController {
    async getProfile(req, res) {
        try {
            const profile = await userService.getProfile(req.user.userId);
            return res.status(200).json({
                success: true,
                message: 'Profile retrieved successfully',
                data: profile
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async updateProfile(req, res) {
        try {
            // Whitelist: email, avatar, password etc. have their own flows
            const { firstName, lastName, phone } = req.body;
            const profile = await userService.updateProfile(req.user.userId, { firstName, lastName, phone });
            return res.status(200).json({
                success: true,
                message: 'Profile updated',
                data: profile
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async updateAvatar(req, res) {
        try {
            const profile = await userService.updateAvatar(req.user.userId, req.file);
            return res.status(200).json({
                success: true,
                message: 'Profile photo updated',
                data: profile
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async requestEmailChange(req, res) {
        try {
            const result = await userService.requestEmailChange(req.user.userId, req.body.newEmail, req.body.password);
            return res.status(200).json({
                success: true,
                message: 'Verification code sent to your new email',
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

    async verifyEmailChange(req, res) {
        try {
            const profile = await userService.verifyEmailChange(req.user.userId, req.body.otp);
            return res.status(200).json({
                success: true,
                message: 'Email updated',
                data: profile
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

module.exports = new UserController();
