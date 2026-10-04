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

    let decoded;
    try {
        const token = authHeader.split(' ')[1];
        decoded = jwtUtil.verifyAccessToken(token);
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired access token.'
        });
    }

    try {
        // The account must still exist and not be blocked (401 / 403)
        await authService.verifyActiveUser(decoded.userId);
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
