const jwt = require('jsonwebtoken');
const env = require('../config/envValidation');

class JwtUtil {
    generateAccessToken(user) {
        return jwt.sign(
            { userId: user._id, role: user.role },
            env.JWT_ACCESS_SECRET,
            { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
        );
    }

    generateRefreshToken(user) {
        return jwt.sign(
            { userId: user._id, role: user.role },
            env.JWT_REFRESH_SECRET,
            { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
        );
    }

    verifyAccessToken(token) {
        return jwt.verify(token, env.JWT_ACCESS_SECRET);
    }

    verifyRefreshToken(token) {
        return jwt.verify(token, env.JWT_REFRESH_SECRET);
    }
}

module.exports = new JwtUtil();