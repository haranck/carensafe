const adminAuthService = require('../../../services/admin/auth/admin.auth.service');
const env = require('../../../config/envValidation');

// The admin refresh token lives in its own cookie, sent only to the admin auth endpoints (never mixed with a
// customer's `refreshToken` cookie)
const ADMIN_REFRESH_COOKIE = 'adminRefreshToken';
const cookieOptions = () => ({
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/admin/auth'
});

const fail = (res, error) => {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
        success: false,
        message: error.message || 'Internal Server Error'
    });
};

class AdminAuthController {
    async adminLogin(req, res) {
        try {
            const { email, password } = req.body;
            const { refreshToken, ...data } = await adminAuthService.adminLogin({ email, password });

            res.cookie(ADMIN_REFRESH_COOKIE, refreshToken, { ...cookieOptions(), maxAge: env.REFRESH_TOKEN_MAX_AGE });
            return res.status(200).json({
                success: true,
                message: 'Admin login successful',
                data
            });
        } catch (error) {
            return fail(res, error);
        }
    }

    async refresh(req, res) {
        try {
            const { refreshToken, ...data } = await adminAuthService.refresh(req.cookies[ADMIN_REFRESH_COOKIE]);

            res.cookie(ADMIN_REFRESH_COOKIE, refreshToken, { ...cookieOptions(), maxAge: env.REFRESH_TOKEN_MAX_AGE });
            return res.status(200).json({
                success: true,
                message: 'Token refreshed successfully',
                data
            });
        } catch (error) {
            return fail(res, error);
        }
    }

    async logout(req, res) {
        try {
            const refreshToken = req.cookies[ADMIN_REFRESH_COOKIE];
            if (refreshToken) await adminAuthService.logout(refreshToken);

            res.clearCookie(ADMIN_REFRESH_COOKIE, cookieOptions());
            return res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            return fail(res, error);
        }
    }
}

module.exports = new AdminAuthController();
