const userRepository = require('../../../repositories/user/user.repository');
const passwordUtil = require('../../../utils/password');
const jwtUtil = require('../../../utils/jwt');
const redisUtil = require('../../../utils/redis');

const httpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const invalidCredentials = () => httpError('Invalid admin credentials', 401);

const toAdminUser = (user) => ({
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    isAdmin: user.isAdmin
});

// Puts a refresh token on the Redis blacklist until it would have expired anyway
const revoke = async (decoded, token) => {
    const expiresInSeconds = decoded.exp - Math.floor(Date.now() / 1000);
    if (expiresInSeconds > 0) {
        await redisUtil.setEx(`blacklist:${token}`, expiresInSeconds, 'revoked');
    }
};

/**
 * Admin session: its own access token + refresh token (the controller sets the refresh token as the `adminRefreshToken`
 * cookie, sent only to /api/admin/auth), separate from customer sessions. The admin flag is never trusted from the
 * token: verifyAdmin reads it from the database on every request.
 */
class AdminAuthService {
    async adminLogin({ email, password }) {
        const normalizedEmail = email.trim().toLowerCase();

        const user = await userRepository.findByEmail(normalizedEmail);
        if (!user || !user.isAdmin) throw invalidCredentials();
        // An account without a password (Google-only) can't log in here (bcrypt would throw)
        if (!user.password) throw invalidCredentials();

        const isPasswordValid = await passwordUtil.compare(password, user.password);
        if (!isPasswordValid) throw invalidCredentials();
        if (user.isBlocked) throw httpError('Your account is blocked.', 403);

        return {
            user: toAdminUser(user),
            accessToken: jwtUtil.generateAccessToken(user),
            refreshToken: jwtUtil.generateRefreshToken(user)
        };
    }

    // Rotation: the old refresh token is blacklisted; reusing it later is refused (403)
    async refresh(refreshToken) {
        if (!refreshToken) throw httpError('Admin session not found. Please log in again.', 401);

        if (await redisUtil.get(`blacklist:${refreshToken}`)) {
            throw httpError('Token has been revoked. Please log in again.', 403);
        }

        let decoded;
        try {
            decoded = jwtUtil.verifyRefreshToken(refreshToken);
        } catch {
            throw httpError('Invalid or expired admin session. Please log in again.', 401);
        }

        const user = await userRepository.findById(decoded.userId);
        if (!user) throw httpError('User no longer exists.', 401);
        if (user.isBlocked) throw httpError('Your account is blocked.', 403);
        if (!user.isAdmin) throw httpError('Admin access required.', 403);

        await revoke(decoded, refreshToken);
        return {
            user: toAdminUser(user),
            accessToken: jwtUtil.generateAccessToken(user),
            refreshToken: jwtUtil.generateRefreshToken(user)
        };
    }

    async logout(refreshToken) {
        try {
            await revoke(jwtUtil.verifyRefreshToken(refreshToken), refreshToken);
        } catch {
            // Already invalid or expired: nothing to revoke
        }
    }

    // Every admin API request: the account must exist (401), not be blocked (403) and be an admin (403)
    async verifyAdmin(userId) {
        const user = await userRepository.findStatusById(userId);
        if (!user) throw httpError('User no longer exists.', 401);
        if (user.isBlocked) throw httpError('Your account is blocked.', 403);
        if (!user.isAdmin) throw httpError('Admin access required.', 403);
    }
}

module.exports = new AdminAuthService();
