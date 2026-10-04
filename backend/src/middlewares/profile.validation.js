const Joi = require('joi');

// Indian mobile: 10 digits starting with 6-9 (same rule as addresses and the frontend zod schema)
const PHONE_PATTERN = /^[6-9]\d{9}$/;

const updateProfileSchema = Joi.object({
    firstName: Joi.string().trim().min(1).max(50).messages({
        'string.empty': 'First name is required.',
        'string.max': 'First name can be at most 50 characters.'
    }),
    lastName: Joi.string().trim().max(50).allow('').messages({
        'string.max': 'Last name can be at most 50 characters.'
    }),
    phone: Joi.string().trim().pattern(PHONE_PATTERN).allow('').messages({
        'string.pattern.base': 'Enter a valid 10-digit Indian mobile number.'
    })
})
    .min(1)
    .messages({ 'object.min': 'Nothing to update.' });

const emailChangeSchema = Joi.object({
    newEmail: Joi.string().trim().email().max(254).required().messages({
        'string.email': 'Please provide a valid email.',
        'string.empty': 'Email is required.',
        'any.required': 'Email is required.'
    })
});

const emailVerifySchema = Joi.object({
    otp: Joi.string().pattern(/^\d{6}$/).required().messages({
        'string.pattern.base': 'Enter the 6-digit code.',
        'string.empty': 'Enter the 6-digit code.',
        'any.required': 'Enter the 6-digit code.'
    })
});

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body || {});
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

const validateUpdateProfile = validate(updateProfileSchema);
const validateEmailChange = validate(emailChangeSchema);
const validateEmailVerify = validate(emailVerifySchema);

module.exports = { validateUpdateProfile, validateEmailChange, validateEmailVerify, PHONE_PATTERN };
