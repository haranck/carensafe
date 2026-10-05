const Joi = require('joi');

// Signup and password reset: min 8, upper, lower, digit, special character
const passwordRule = Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])')).required().messages({
    'string.min': 'Password must be at least 8 characters long.',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    'string.empty': 'Password is required.',
    'any.required': 'Password is required.'
});

const emailRule = Joi.string().trim().email().required().messages({
    'string.base': 'Please provide a valid email.',
    'string.email': 'Please provide a valid email.',
    'string.empty': 'Email is required.',
    'any.required': 'Email is required.'
});

const signupSchema = Joi.object({
    firstName: Joi.string().trim().required().messages({
        'string.empty': 'First name is required.'
    }),
    lastName: Joi.string().trim().optional().allow(''),
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email.',
        'string.empty': 'Email is required.'
    }),
    password: passwordRule,
    phone: Joi.string().trim().optional().allow('')
});

const forgotPasswordSchema = Joi.object({
    email: emailRule
});

const verifyResetOtpSchema = Joi.object({
    email: emailRule,
    otp: Joi.string().pattern(/^\d{6}$/).required().messages({
        'string.pattern.base': 'Enter the 6-digit code.',
        'string.empty': 'Enter the 6-digit code.',
        'any.required': 'Enter the 6-digit code.'
    })
});

const resetPasswordSchema = Joi.object({
    resetToken: Joi.string().hex().length(64).required().messages({
        'string.hex': 'Your reset session is invalid. Please start again.',
        'string.length': 'Your reset session is invalid. Please start again.',
        'string.empty': 'Your reset session is invalid. Please start again.',
        'any.required': 'Your reset session is invalid. Please start again.'
    }),
    password: passwordRule
});

const otpRule = Joi.string().pattern(/^\d{6}$/).required().messages({
    'string.base': 'Enter the 6-digit code.',
    'string.pattern.base': 'Enter the 6-digit code.',
    'string.empty': 'Enter the 6-digit code.',
    'any.required': 'Enter the 6-digit code.'
});

// Signup step 2 / resend
const verifyOtpSchema = Joi.object({
    email: emailRule,
    otp: otpRule
});

const resendOtpSchema = Joi.object({
    email: emailRule
});

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email.',
        'string.empty': 'Email is required.'
    }),
    password: Joi.string().required().messages({
        'string.empty': 'Password is required.'
    })
});

const googleAuthSchema = Joi.object({
    code: Joi.string().trim().required().messages({
        'string.base': 'Google authorization code is required.',
        'string.empty': 'Google authorization code is required.',
        'any.required': 'Google authorization code is required.'
    })
});

const validateSignup = (req, res, next) => {
    const { error } = signupSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

const validateLogin = (req, res, next) => {
    const { error } = loginSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

const validateGoogleAuth = (req, res, next) => {
    const { error } = googleAuthSchema.validate(req.body || {});
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

const validateBody = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body || {});
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

const validateForgotPassword = validateBody(forgotPasswordSchema);
const validateVerifyResetOtp = validateBody(verifyResetOtpSchema);
const validateVerifyOtp = validateBody(verifyOtpSchema);
const validateResendOtp = validateBody(resendOtpSchema);
const validateResetPassword = validateBody(resetPasswordSchema);

module.exports = {
    validateSignup,
    validateLogin,
    validateGoogleAuth,
    validateForgotPassword,
    validateVerifyResetOtp,
    validateResetPassword,
    validateVerifyOtp,
    validateResendOtp
};
