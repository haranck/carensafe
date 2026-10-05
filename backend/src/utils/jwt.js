const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/envValidation');

class JwtUtil {
    generateAccessToken(user) {
        return jwt.sign(
            { userId: user._id },
            env.JWT_ACCESS_SECRET,
            { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
        );
    }

    // A unique id per token: two tokens issued in the same second would otherwise be identical, and blacklisting one
    // (rotation / logout) would revoke the other
    generateRefreshToken(user) {
        return jwt.sign(
            { userId: user._id },
            env.JWT_REFRESH_SECRET,
            { expiresIn: env.JWT_REFRESH_EXPIRES_IN, jwtid: crypto.randomUUID() }
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