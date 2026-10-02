const userRepository = require('../../../repositories/user/user.repository');
const passwordUtil = require('../../../utils/password');
const otpUtil = require('../../../utils/otp');
const redisUtil = require('../../../utils/redis');
const jwtUtil = require('../../../utils/jwt');
const emailUtil = require('../../../utils/email');

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

        // 5. Send OTP via actual Email Utility
        await emailUtil.sendOtpEmail(normalizedEmail, otp);

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

        await emailUtil.sendOtpEmail(normalizedEmail, otp);

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
            role: 'USER',
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
                role: user.role,
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
                isAdmin: user.isAdmin,
                role: user.role
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
            const error = new Error('Your account is blocked');
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