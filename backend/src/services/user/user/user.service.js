const userRepository = require('../../../repositories/user/user.repository');
const otpUtil = require('../../../utils/otp');
const redisUtil = require('../../../utils/redis');
const cloudinaryUtil = require('../../../utils/cloudinary');
const emailService = require('../auth/email.service');

const EMAIL_CHANGE_TTL = 300; // seconds, same as the signup OTP
const EMAIL_CHANGE_COOLDOWN = 30; // seconds between "send code" requests
const MAX_OTP_ATTEMPTS = 3;
const PHONE_PATTERN = /^[6-9]\d{9}$/;

const emailChangeKey = (userId) => `email_change:${userId}`;
const emailCooldownKey = (userId) => `email_change_cooldown:${userId}`;

const httpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// Never password / tokens. canChangeEmail: Google-only accounts (no password) keep their Google email.
// Same user fields as the login response, so the frontend can pass it straight to setAuthUser.
const toProfile = (user) => ({
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName || '',
    email: user.email,
    phone: user.phone || '',
    avatarUrl: user.avatarUrl || null,
    authProvider: user.authProvider || 'local',
    canChangeEmail: Boolean(user.password),
    isAdmin: user.isAdmin,
    createdAt: user.createdAt
});

class UserService {
    async getUser(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw httpError('User not found.', 404);
        }
        return user;
    }

    async getProfile(userId) {
        return toProfile(await this.getUser(userId));
    }

    // Only firstName / lastName / phone; an empty phone removes it
    async updateProfile(userId, { firstName, lastName, phone }) {
        const updateData = {};
        if (firstName !== undefined) {
            const value = firstName.trim();
            if (!value) throw httpError('First name is required.', 400);
            updateData.firstName = value;
        }
        if (lastName !== undefined) {
            updateData.lastName = lastName.trim();
        }
        if (phone !== undefined) {
            const value = phone.trim();
            if (value && !PHONE_PATTERN.test(value)) {
                throw httpError('Enter a valid 10-digit Indian mobile number.', 400);
            }
            updateData.phone = value;
        }

        const user = await userRepository.updateById(userId, updateData);
        if (!user) {
            throw httpError('User not found.', 404);
        }
        return toProfile(user);
    }

    // New photo saved first; the old uploaded one is then deleted (best effort)
    async updateAvatar(userId, file) {
        if (!file) {
            throw httpError('Please choose an image to upload.', 400);
        }

        const current = await this.getUser(userId);
        const user = await userRepository.updateById(userId, { avatarUrl: file.path, avatarPublicId: file.filename });
        if (current.avatarPublicId && current.avatarPublicId !== file.filename) {
            await cloudinaryUtil.deleteImage(current.avatarPublicId);
        }
        return toProfile(user);
    }

    async requestEmailChange(userId, newEmail) {
        const user = await this.getUser(userId);
        if (!user.password) {
            throw httpError('Your email is managed by your Google account.', 403);
        }

        const normalizedEmail = newEmail.trim().toLowerCase();
        if (normalizedEmail === user.email) {
            throw httpError('This is already your email address.', 400);
        }
        if (await userRepository.existsByEmail(normalizedEmail)) {
            throw httpError('An account with this email already exists.', 409);
        }
        if (await redisUtil.get(emailCooldownKey(userId))) {
            throw httpError(`Please wait ${EMAIL_CHANGE_COOLDOWN} seconds before requesting another code.`, 429);
        }

        const otp = otpUtil.generateOtp();
        await redisUtil.setEx(emailChangeKey(userId), EMAIL_CHANGE_TTL, {
            newEmail: normalizedEmail,
            otp,
            attempts: 0,
            expiresAt: Date.now() + EMAIL_CHANGE_TTL * 1000
        });
        await redisUtil.setEx(emailCooldownKey(userId), EMAIL_CHANGE_COOLDOWN, 1);

        // The code goes to the NEW address: receiving it proves the user owns it
        await emailService.sendOtpEmail(normalizedEmail, otp);

        return { newEmail: normalizedEmail, expiresIn: EMAIL_CHANGE_TTL };
    }

    // Wrong codes count against the same 5-minute window (the window is not extended)
    async verifyEmailChange(userId, otp) {
        const key = emailChangeKey(userId);
        const pending = await redisUtil.get(key);
        if (!pending) {
            throw httpError('The code has expired. Please request a new one.', 400);
        }

        if (pending.otp !== otp) {
            const attempts = pending.attempts + 1;
            const secondsLeft = Math.ceil((pending.expiresAt - Date.now()) / 1000);
            if (attempts >= MAX_OTP_ATTEMPTS || secondsLeft <= 0) {
                await redisUtil.delete(key);
                throw httpError('Too many incorrect attempts. Please request a new code.', 400);
            }
            await redisUtil.setEx(key, secondsLeft, { ...pending, attempts });
            const left = MAX_OTP_ATTEMPTS - attempts;
            throw httpError(`Invalid code. You have ${left} ${left === 1 ? 'attempt' : 'attempts'} left.`, 400);
        }

        // Someone may have registered it since the code was sent
        if (await userRepository.existsByEmail(pending.newEmail)) {
            await redisUtil.delete(key);
            throw httpError('An account with this email already exists.', 409);
        }

        const user = await userRepository.updateById(userId, { email: pending.newEmail });
        await redisUtil.delete(key);
        await redisUtil.delete(emailCooldownKey(userId));
        return toProfile(user);
    }
}

module.exports = new UserService();
