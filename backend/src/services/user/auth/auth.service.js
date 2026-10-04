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

const resetOtpKey = (email) => `password_reset:${email}`;
const resetCooldownKey = (email) => `password_reset_cooldown:${email}`;
const resetTokenKey = (token) => `password_reset_token:${token}`;

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

        const redisKey = `signup:${normalizedEmail}`;
        const attemptsKey = `otp_attempts:${normalizedEmail}`;
        const expirationTime = 300; // 5 minutes (change to 30 for production)

        await redisUtil.setEx(redisKey, expirationTime, signupData);
        // Reset attempts
        await redisUtil.setEx(attemptsKey, expirationTime, 0);

        // 5. Send OTP via Email Service
        await emailService.sendOtpEmail(normalizedEmail, otp);

        return {
            message: 'OTP sent to email. Verification required to complete signup.',
            expiresIn: '5 minutes'
        };
    }

    async resendOtp(email) {
        if (!email) {
            const error = new Error('Email is required.');
            error.statusCode = 400;
            throw error;
        }

        const normalizedEmail = email.trim().toLowerCase();
        const redisKey = `signup:${normalizedEmail}`;
        const attemptsKey = `otp_attempts:${normalizedEmail}`;

        const signupData = await redisUtil.get(redisKey);
        if (!signupData) {
            const error = new Error('Signup session expired. Please sign up again.');
            error.statusCode = 400;
            throw error;
        }

        const otp = otpUtil.generateOtp();
        signupData.otp = otp;
        
        const expirationTime = 300; 

        await redisUtil.setEx(redisKey, expirationTime, signupData);
        await redisUtil.setEx(attemptsKey, expirationTime, 0);

        await emailService.sendOtpEmail(normalizedEmail, otp);

        return {
            message: 'OTP resent successfully.',
            expiresIn: '5 minutes'
        };
    }

    async verifyOtp({ email, otp }) {
        if (!email || !otp) {
            const error = new Error('Email and OTP are required.');
            error.statusCode = 400;
            throw error;
        }

        const normalizedEmail = email.trim().toLowerCase();
        const redisKey = `signup:${normalizedEmail}`;
        const attemptsKey = `otp_attempts:${normalizedEmail}`;

        // 1. Get temporary data from Redis
        const signupData = await redisUtil.get(redisKey);
        if (!signupData) {
            const error = new Error('OTP expired or signup session not found.');
            error.statusCode = 400;
            throw error;
        }

        // 2. Brute Force Protection Check
        let attempts = await redisUtil.get(attemptsKey) || 0;
        if (attempts >= 3) {
            await redisUtil.delete(redisKey);
            await redisUtil.delete(attemptsKey);
            const error = new Error('Too many incorrect attempts. Session invalidated, please sign up again.');
            error.statusCode = 403;
            throw error;
        }

        // 3. Compare OTP
        if (signupData.otp !== otp) {
            attempts += 1;
            await redisUtil.setEx(attemptsKey, 30, attempts); // Keep same 30s TTL
            const error = new Error(`Invalid OTP. You have ${3 - attempts} attempts left.`);
            error.statusCode = 400;
            throw error;
        }

        // 4. OTP is correct, double check DB
        const existingUser = await userRepository.findByEmail(normalizedEmail);
        if (existingUser) {
            await redisUtil.delete(redisKey);
            await redisUtil.delete(attemptsKey);
            const error = new Error('User with this email already exists.');
            error.statusCode = 409;
            throw error;
        }

        // 5. Create user in MongoDB
        const newUser = await userRepository.create({
            firstName: signupData.firstName,
            lastName: signupData.lastName,
            email: signupData.email,
            password: signupData.hashedPassword,
            phone: signupData.phone,
            isAdmin: false
        });

        // 6. Delete Redis temporary data
        await redisUtil.delete(redisKey);
        await redisUtil.delete(attemptsKey);

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

        // Google-only accounts have no password (bcrypt.compare would throw)
        if (!user.password) {
            const error = new Error('This account uses Google sign-in. Continue with Google, or use Forgot Password to create a password.');
            error.statusCode = 400;
            throw error;
        }

        const isPasswordValid = await passwordUtil.compare(password, user.password);
        if (!isPasswordValid) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
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

        // 1. Check if token is blacklisted (Token Reuse Detection)
        const isBlacklisted = await redisUtil.get(`blacklist:${refreshToken}`);
        if (isBlacklisted) {
            const error = new Error('Token has been revoked. Malicious activity detected. Please log in again.');
            error.statusCode = 403;
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

        const currentTime = Math.floor(Date.now() / 1000);
        const expiresInSeconds = decoded.exp - currentTime;
        if (expiresInSeconds > 0) {
            await redisUtil.setEx(`blacklist:${refreshToken}`, expiresInSeconds, 'revoked');
        }

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
        await userRepository.updateById(user._id, { password: hashedPassword });
        await redisUtil.delete(key);

        return { email: user.email };
    }

    // authMiddleware, on every protected request: deleted or blocked accounts lose access straight away,
    // not when their access token expires
    async verifyActiveUser(userId) {
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
    }

    async logout(refreshToken) {
        try {
            const decoded = jwtUtil.verifyRefreshToken(refreshToken);
            const currentTime = Math.floor(Date.now() / 1000);
            const expiresInSeconds = decoded.exp - currentTime;
            if (expiresInSeconds > 0) {
                await redisUtil.setEx(`blacklist:${refreshToken}`, expiresInSeconds, 'revoked');
            }
        } catch (error) {
            // Ignore if token is already expired or invalid
        }
    }
}

module.exports = new AuthService();