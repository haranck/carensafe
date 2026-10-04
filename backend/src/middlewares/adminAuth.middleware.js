const jwtUtil = require('../utils/jwt');
const adminAuthService = require('../services/admin/auth/admin.auth.service');

// Admin API guard: `Authorization: Bearer <admin access token>`, then the account must still be an active admin
// (read from the database on every request). Sets req.user = { userId }. 401 / 403 otherwise.
const adminAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    let decoded;
    try {
        decoded = jwtUtil.verifyAccessToken(authHeader.split(' ')[1]);
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired access token.'
        });
    }

    try {
        await adminAuthService.verifyAdmin(decoded.userId);
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }

    req.user = { userId: decoded.userId };
    next();
};

module.exports = adminAuthMiddleware;
