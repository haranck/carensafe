const crypto = require('crypto');
const userRepository = require('../../../repositories/user/user.repository');
const passwordUtil = require('../../../utils/password');
const otpUtil = require('../../../utils/otp');
const redisUtil = require('../../../utils/redis');
const jwtUtil = require('../../../utils/jwt');
const googleUtil = require('../../../utils/google');
const emailService = require('./email.service');

const RESET_OTP_TTL = 300; // seconds, same as the signup OTP
const RESET_COOLDOWN = 30; // seconds between "send code" requests
const RESET_TOKEN_TTL = 600; // seconds to choose the new password after the code is verified
const MAX_RESET_ATTEMPTS = 3;
const RESET_SENT_MESSAGE = "If an account exists for this email, we've sent a verification code.";

const SIGNUP_OTP_TTL = 300; // seconds
const SIGNUP_RESEND_COOLDOWN = 30; // seconds between codes (the OTP modal waits the same)
const MAX_SIGNUP_ATTEMPTS = 3;
// Two refreshes with the same token this close together are two tabs racing, not a stolen token
const REFRESH_REUSE_GRACE_MS = 10 * 1000;

const signupKey = (email) => `signup:${email}`;
const signupCooldownKey = (email) => `signup_resend_cooldown:${email}`;
const blacklistKey = (token) => `blacklist:${token}`;
const resetOtpKey = (email) => `password_reset:${email}`;
const resetCooldownKey = (email) => `password_reset_cooldown:${email}`;
const resetTokenKey = (token) => `password_reset_token:${token}`;

const httpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// Now, to the second (JWT iat has whole seconds): tokens issued from this second on stay valid
const nowToTheSecond = () => new Date(Math.floor(Date.now() / 1000) * 1000);

// A token issued before the account's tokensValidAfter (password reset, stolen token detected) is no longer accepted
const issuedBeforeRevocation = (user, issuedAt) =>
    Boolean(user.tokensValidAfter && issuedAt * 1000 < new Date(user.tokensValidAfter).getTime());

// Keeps a revoked token in Redis until it would have expired anyway
const blacklistUntilExpiry = async (token, exp, value) => {
    const secondsLeft = exp - Math.floor(Date.now() / 1000);
    if (secondsLeft > 0) await redisUtil.setEx(blacklistKey(token), secondsLeft, value);
};

class AuthService {
    async signup({ firstName, lastName, email, password, phone }) {
        const normalizedEmail = email.trim().toLowerCase();

        // 1. Check if user already exists in DB
        const existingUser = await userRepository.findByEmail(normalizedEmail);
        if (existingUser) {
            const error = new Error('User with this email already exists.');
            error.statusCode = 409;
            throw error;
        }

        // 2. Hash password
        const hashedPassword = await passwordUtil.hash(password);

        // 3. Generate 6-digit OTP
        const otp = otpUtil.generateOtp();

        // 4. Store temporary signup data in Redis
        const signupData = {
            firstName: firstName.trim(),
            lastName: lastName ? lastName.trim() : undefined,
            email: normalizedEmail,
            hashedPassword,
            phone: phone ? phone.trim() : undefined,
            otp
        };

        // Wrong codes are counted in the same record, so they share its 5-minute window
        await redisUtil.setEx(signupKey(normalizedEmail), SIGNUP_OTP_TTL, {
            ...signupData,
            attempts: 0,
            expiresAt: Date.now() + SIGNUP_OTP_TTL * 1000
        });
        await redisUtil.setEx(signupCooldownKey(normalizedEmail), SIGNUP_RESEND_COOLDOWN, 1);

        // 5. Send OTP via Email Service
        await emailService.sendOtpEmail(normalizedEmail, otp);

        return {
            message: 'OTP sent to email. Verification required to complete signup.',
            expiresIn: '5 minutes'
        };
    }

    // A new code (and a fresh 5-minute window with 3 tries), at most one every 30 seconds
    async resendOtp(email) {
        const normalizedEmail = email.trim().toLowerCase();
        const signupData = await redisUtil.get(signupKey(normalizedEmail));
        if (!signupData) {
            throw httpError('Signup session expired. Please sign up again.', 400);
        }
        if (await redisUtil.get(signupCooldownKey(normalizedEmail))) {
            throw httpError(`Please wait ${SIGNUP_RESEND_COOLDOWN} seconds before requesting another code.`, 429);
        }

        const otp = otpUtil.generateOtp();
        await redisUtil.setEx(signupKey(normalizedEmail), SIGNUP_OTP_TTL, {
            ...signupData,
            otp,
            attempts: 0,
            expiresAt: Date.now() + SIGNUP_OTP_TTL * 1000
        });
        await redisUtil.setEx(signupCooldownKey(normalizedEmail), SIGNUP_RESEND_COOLDOWN, 1);

        await emailService.sendOtpEmail(normalizedEmail, otp);

        return {
            message: 'OTP resent successfully.',
            expiresIn: '5 minutes'
        };
    }

    async verifyOtp({ email, otp }) {
        const normalizedEmail = email.trim().toLowerCase();
        const redisKey = signupKey(normalizedEmail);

        // 1. Get temporary data from Redis
        const signupData = await redisUtil.get(redisKey);
        if (!signupData) {
            const error = new Error('OTP expired or signup session not found.');
            error.statusCode = 400;
            throw error;
        }

        // 2. Wrong code: counted against the same 5-minute window (never extended); the 3rd wrong one ends the signup
        if (signupData.otp !== otp) {
            const attempts = (signupData.attempts || 0) + 1;
            const secondsLeft = Math.ceil(((signupData.expiresAt || 0) - Date.now()) / 1000);
            if (attempts >= MAX_SIGNUP_ATTEMPTS || secondsLeft <= 0) {
                await redisUtil.delete(redisKey);
                throw httpError('Too many incorrect attempts. Session invalidated, please sign up again.', 403);
            }
            await redisUtil.setEx(redisKey, secondsLeft, { ...signupData, attempts });
            const left = MAX_SIGNUP_ATTEMPTS - attempts;
            throw httpError(`Invalid OTP. You have ${left} ${left === 1 ? 'attempt' : 'attempts'} left.`, 400);
        }

        // 3. OTP is correct, double check DB
        const existingUser = await userRepository.findByEmail(normalizedEmail);
        if (existingUser) {
            await redisUtil.delete(redisKey);
            const error = new Error('User with this email already exists.');
            error.statusCode = 409;
            throw error;
        }

        // 4. Create user in MongoDB
        const newUser = await userRepository.create({
            firstName: signupData.firstName,
            lastName: signupData.lastName,
            email: signupData.email,
            password: signupData.hashedPassword,
            phone: signupData.phone,
            isAdmin: false
        });

        // 5. Delete Redis temporary data
        await redisUtil.delete(redisKey);
        await redisUtil.delete(signupCooldownKey(normalizedEmail));

        const userResponse = newUser.toObject();
        delete userResponse.password;

        return userResponse;
    }

    async login({ email, password }) {
        const normalizedEmail = email.trim().toLowerCase();

        const user = await userRepository.findByEmail(normalizedEmail);
        if (!user) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            throw error;
        }

        // Google-only accounts have no password (bcrypt.compare would throw)
        if (!user.password) {
            const error = new Error('This account uses Google sign-in. Continue with Google, or use Forgot Password to create a password.');
            error.statusCode = 400;
            throw error;
        }

        // The password is checked first: without it, admin / blocked accounts look like any wrong login
        const isPasswordValid = await passwordUtil.compare(password, user.password);
        if (!isPasswordValid) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            throw error;
        }

        if (user.isAdmin) {
            const error = new Error('Admins are not allowed to log in from the user portal.');
            error.statusCode = 403;
            throw error;
        }

        if (user.isBlocked) {
            const error = new Error('Your account is blocked.');
            error.statusCode = 403;
            throw error;
        }

        const accessToken = jwtUtil.generateAccessToken(user);
        const refreshToken = jwtUtil.generateRefreshToken(user);

        return {
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                avatarUrl: user.avatarUrl,
                isAdmin: user.isAdmin
            },
            accessToken,
            refreshToken
        };
    }

    async googleLogin(code) {
        // Only the verified id_token payload is trusted, never profile data from the client
        const payload = await googleUtil.verifyGoogleCode(code);

        if (!payload.email || !payload.email_verified) {
            const error = new Error('Your Google email is not verified.');
            error.statusCode = 401;
            throw error;
        }

        const normalizedEmail = payload.email.trim().toLowerCase();

        let user = await userRepository.findByGoogleId(payload.sub);
        if (!user) {
            user = await userRepository.findByEmail(normalizedEmail);
        }

        if (user) {
            if (user.isAdmin) {
                const error = new Error('Admins are not allowed to log in from the user portal.');
                error.statusCode = 403;
                throw error;
            }

            if (user.isBlocked) {
                const error = new Error('Your account is blocked.');
                error.statusCode = 403;
                throw error;
            }

            if (user.googleId && user.googleId !== payload.sub) {
                const error = new Error('This email is linked to a different Google account.');
                error.statusCode = 409;
                throw error;
            }

            // Existing email account: link Google (accounts with a password stay 'local' and keep password login)
            if (!user.googleId) {
                const updateData = { googleId: payload.sub };
                if (!user.password) updateData.authProvider = 'google';
                if (!user.avatarUrl && payload.picture) updateData.avatarUrl = payload.picture;

                user = await userRepository.updateById(user._id, updateData);
            }
        } else {
            // New user: Google already verified the email, so no OTP step
            user = await userRepository.create({
                firstName: payload.given_name || payload.name || normalizedEmail.split('@')[0],
                lastName: payload.family_name,
                email: normalizedEmail,
                googleId: payload.sub,
                authProvider: 'google',
                avatarUrl: payload.picture,
                isAdmin: false
            });
        }

        const accessToken = jwtUtil.generateAccessToken(user);
        const refreshToken = jwtUtil.generateRefreshToken(user);

        return {
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                avatarUrl: user.avatarUrl,
                isAdmin: user.isAdmin
            },
            accessToken,
            refreshToken
        };
    }

    async adminLogin({ email, password }) {
        const normalizedEmail = email.trim().toLowerCase();

        const user = await userRepository.findByEmail(normalizedEmail);
        if (!user || !user.isAdmin) {
            const error = new Error('Invalid admin credentials');
            error.statusCode = 401;
            throw error;
        }

        const isPasswordValid = await passwordUtil.compare(password, user.password);
        if (!isPasswordValid) {
            const error = new Error('Invalid admin credentials');
            error.statusCode = 401;
            throw error;
        }

        return {
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                isAdmin: user.isAdmin
            }
        };
    }

    async refresh(refreshToken) {
        if (!refreshToken) {
            const error = new Error('Refresh token is required');
            error.statusCode = 400;
            throw error;
        }

        let decoded;
        try {
            decoded = jwtUtil.verifyRefreshToken(refreshToken);
        } catch (err) {
            const error = new Error('Invalid or expired refresh token');
            error.statusCode = 401;
            throw error;
        }

        // 1. Token reuse detection. A token rotated seconds ago is two tabs refreshing together (allowed); anything
        // else (logged out, or rotated earlier) means a copy of it is being replayed: every session of the account ends.
        const revoked = await redisUtil.get(blacklistKey(refreshToken));
        if (revoked) {
            const racing = Boolean(revoked.rotatedAt) && Date.now() - revoked.rotatedAt < REFRESH_REUSE_GRACE_MS;
            if (!racing) {
                await userRepository.revokeTokensBefore(decoded.userId, nowToTheSecond());
                throw httpError('Token has been revoked. Malicious activity detected. Please log in again.', 403);
            }
        }

        const user = await userRepository.findById(decoded.userId);
        if (!user) {
            const error = new Error('User no longer exists');
            error.statusCode = 401;
            throw error;
        }
        if (user.isBlocked) {
            const error = new Error('Your account is blocked.');
            error.statusCode = 403;
            throw error;
        }
        // An admin's refresh token can't open a customer session (admins refresh through /api/admin/auth/refresh)
        if (user.isAdmin) {
            const error = new Error('Admins are not allowed to log in from the user portal.');
            error.statusCode = 403;
            throw error;
        }
        // Sessions ended by a password reset / stolen token detection
        if (issuedBeforeRevocation(user, decoded.iat)) {
            throw httpError('Your session has ended. Please log in again.', 401);
        }

        // Rotation: the old token is spent (racing tabs keep the first rotation time)
        if (!revoked) await blacklistUntilExpiry(refreshToken, decoded.exp, { rotatedAt: Date.now() });

        const accessToken = jwtUtil.generateAccessToken(user);
        const newRefreshToken = jwtUtil.generateRefreshToken(user);

        return { accessToken, refreshToken: newRefreshToken };
    }

    // Step 1 of forgot password. Same answer whether or not the email has an account (no account lookup through
    // this form); only active, non-admin accounts actually get a code. Google-only accounts use it to create a password.
    async forgotPassword(email) {
        const normalizedEmail = email.trim().toLowerCase();
        if (await redisUtil.get(resetCooldownKey(normalizedEmail))) {
            const error = new Error(`Please wait ${RESET_COOLDOWN} seconds before requesting another code.`);
            error.statusCode = 429;
            throw error;
        }
        await redisUtil.setEx(resetCooldownKey(normalizedEmail), RESET_COOLDOWN, 1);

        const user = await userRepository.findByEmail(normalizedEmail);
        if (user && !user.isAdmin && !user.isBlocked) {
            const otp = otpUtil.generateOtp();
            await redisUtil.setEx(resetOtpKey(normalizedEmail), RESET_OTP_TTL, {
                otp,
                attempts: 0,
                expiresAt: Date.now() + RESET_OTP_TTL * 1000
            });
            await emailService.sendOtpEmail(normalizedEmail, otp);
        }

        return { message: RESET_SENT_MESSAGE, expiresIn: RESET_OTP_TTL };
    }

    // Step 2: a correct code is swapped for a one-time reset token (10 min). Wrong codes count against the same
    // 5-minute window; the 3rd wrong one ends it.
    async verifyResetOtp(email, otp) {
        const normalizedEmail = email.trim().toLowerCase();
        const key = resetOtpKey(normalizedEmail);
        const pending = await redisUtil.get(key);
        if (!pending) {
            const error = new Error('The code has expired. Please request a new one.');
            error.statusCode = 400;
            throw error;
        }

        if (pending.otp !== otp) {
            const attempts = pending.attempts + 1;
            const secondsLeft = Math.ceil((pending.expiresAt - Date.now()) / 1000);
            if (attempts >= MAX_RESET_ATTEMPTS || secondsLeft <= 0) {
                await redisUtil.delete(key);
                const error = new Error('Too many incorrect attempts. Please request a new code.');
                error.statusCode = 400;
                throw error;
            }
            await redisUtil.setEx(key, secondsLeft, { ...pending, attempts });
            const left = MAX_RESET_ATTEMPTS - attempts;
            const error = new Error(`Invalid code. You have ${left} ${left === 1 ? 'attempt' : 'attempts'} left.`);
            error.statusCode = 400;
            throw error;
        }

        await redisUtil.delete(key);
        const resetToken = crypto.randomBytes(32).toString('hex');
        await redisUtil.setEx(resetTokenKey(resetToken), RESET_TOKEN_TTL, { email: normalizedEmail });
        return { resetToken, expiresIn: RESET_TOKEN_TTL };
    }

    // Step 3: sets the new password (or the first one, for Google-only accounts) and burns the token
    async resetPassword(resetToken, password) {
        const key = resetTokenKey(resetToken);
        const session = await redisUtil.get(key);
        const user = session ? await userRepository.findByEmail(session.email) : null;
        if (!user || user.isBlocked || user.isAdmin) {
            const error = new Error('Your reset session has expired. Please start again.');
            error.statusCode = 400;
            throw error;
        }

        const hashedPassword = await passwordUtil.hash(password);
        // Every device logged in before the reset is logged out (a stolen session doesn't survive it)
        await userRepository.updateById(user._id, { password: hashedPassword, tokensValidAfter: nowToTheSecond() });
        await redisUtil.delete(key);

        return { email: user.email };
    }

    // authMiddleware, on every protected request: deleted or blocked accounts and ended sessions lose access straight
    // away, not when their access token expires. issuedAt: the access token's iat.
    async verifyActiveUser(userId, issuedAt) {
        const user = await userRepository.findStatusById(userId);
        if (!user) {
            const error = new Error('User no longer exists.');
            error.statusCode = 401;
            throw error;
        }

        if (user.isBlocked) {
            const error = new Error('Your account is blocked.');
            error.statusCode = 403;
            throw error;
        }

        // Admin tokens only work on the admin API (adminAuth.middleware); never on customer endpoints
        if (user.isAdmin) {
            const error = new Error('Admins are not allowed to log in from the user portal.');
            error.statusCode = 403;
            throw error;
        }

        if (issuedBeforeRevocation(user, issuedAt)) {
            throw httpError('Your session has ended. Please log in again.', 401);
        }
    }

    // Access tokens of logged-out sessions (authMiddleware)
    async isAccessTokenRevoked(accessToken) {
        return Boolean(await redisUtil.get(blacklistKey(accessToken)));
    }

    // Revokes both tokens of this session: the refresh token, and the access token so it stops working now instead of
    // when it expires. Either may be missing, expired or invalid (nothing to revoke then).
    async logout(refreshToken, accessToken) {
        if (refreshToken) {
            try {
                const decoded = jwtUtil.verifyRefreshToken(refreshToken);
                await blacklistUntilExpiry(refreshToken, decoded.exp, 'revoked');
            } catch (error) {
                // Already expired or invalid
            }
        }
        if (accessToken) {
            try {
                const decoded = jwtUtil.verifyAccessToken(accessToken);
                await blacklistUntilExpiry(accessToken, decoded.exp, 'revoked');
            } catch (error) {
                // Already expired or invalid
            }
        }
    }
}

module.exports = new AuthService();