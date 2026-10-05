const jwtUtil = require('../utils/jwt');
const authService = require('../services/user/auth/auth.service');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jwtUtil.verifyAccessToken(token);
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired access token.'
        });
    }

    try {
        // Logged out: this access token was revoked with its session
        if (await authService.isAccessTokenRevoked(token)) {
            return res.status(401).json({
                success: false,
                message: 'Your session has ended. Please log in again.'
            });
        }
        // The account must still exist, not be blocked, and this session must not have been ended (401 / 403)
        await authService.verifyActiveUser(decoded.userId, decoded.iat);
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

module.exports = authMiddleware;
