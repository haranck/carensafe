const Joi = require('joi');

const signupSchema = Joi.object({
    firstName: Joi.string().trim().required().messages({
        'string.empty': 'First name is required.'
    }),
    lastName: Joi.string().trim().optional().allow(''),
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email.',
        'string.empty': 'Email is required.'
    }),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])')).required().messages({
        'string.min': 'Password must be at least 8 characters long.',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
        'string.empty': 'Password is required.'
    }),
    phone: Joi.string().trim().optional().allow('')
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

module.exports = { validateSignup, validateLogin };
