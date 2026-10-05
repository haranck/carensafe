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

    async resendOtp(req, res) {
        try {
            const { email } = req.body;
            const response = await authService.resendOtp(email);

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

    async googleLogin(req, res) {
        try {
            const { code } = req.body;
            const data = await authService.googleLogin(code);

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

    async forgotPassword(req, res) {
        try {
            const result = await authService.forgotPassword(req.body.email);
            return res.status(200).json({
                success: true,
                message: result.message,
                data: { expiresIn: result.expiresIn }
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }

    async verifyResetOtp(req, res) {
        try {
            const { email, otp } = req.body;
            const result = await authService.verifyResetOtp(email, otp);
            return res.status(200).json({
                success: true,
                message: 'Code verified. Choose a new password.',
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

    async resetPassword(req, res) {
        try {
            const { resetToken, password } = req.body;
            const result = await authService.resetPassword(resetToken, password);
            return res.status(200).json({
                success: true,
                message: 'Password updated. Please log in with your new password.',
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
            // Both tokens of this session are revoked (the access token arrives as the usual Bearer header)
            const refreshToken = req.cookies.refreshToken;
            const authHeader = req.headers.authorization || '';
            const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
            await authService.logout(refreshToken, accessToken);

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
