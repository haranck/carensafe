const authService = require('../../../services/user/auth/auth.service');
const env = require('../../../config/envValidation');

class AuthController {
    async signup(req, res) {
        try {
            const { firstName, lastName, email, password, phone } = req.body;

            const response = await authService.signup({ firstName, lastName, email, password, phone });

            return res.status(200).json({
                success: true,
                message: response.message,
                data: response
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async verifyOtp(req, res) {
        try {
            const { email, otp } = req.body;

            const user = await authService.verifyOtp({ email, otp });

            return res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: user
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const data = await authService.login({ email, password });

            res.cookie('refreshToken', data.refreshToken, {
                httpOnly: true,
                secure: env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: env.REFRESH_TOKEN_MAX_AGE
            });

            // Strip refreshToken from the response body for security
            const { refreshToken, ...responseData } = data;

            return res.status(200).json({
                success: true,
                message: 'Login successful',
                data: responseData
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }


    async refresh(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token not found. Please log in again.'
                });
            }

            const data = await authService.refresh(refreshToken);

            // Set the NEW refresh token cookie (Rotation)
            res.cookie('refreshToken', data.refreshToken, {
                httpOnly: true,
                secure: env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: env.REFRESH_TOKEN_MAX_AGE
            });

            const { refreshToken: newRt, ...responseData } = data;

            return res.status(200).json({
                success: true,
                message: 'Token refreshed successfully',
                data: responseData
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async logout(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (refreshToken) {
                await authService.logout(refreshToken);
            }

            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
            return res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Internal Server Error'
            });
        }
    }
}

module.exports = new AuthController();
