const Joi = require('joi');
const { CONTACT_TOPIC_KEYS } = require('../config/contact');
const { PHONE_PATTERN } = require('./profile.validation');

const contactSchema = Joi.object({
    name: Joi.string().trim().min(2).max(60).required().messages({
        'string.empty': 'Please enter your name.',
        'string.min': 'Name must be at least 2 characters.',
        'string.max': 'Name can be at most 60 characters.',
        'any.required': 'Please enter your name.'
    }),
    email: Joi.string().trim().email().max(120).required().messages({
        'string.email': 'Please enter a valid email address.',
        'string.empty': 'Please enter your email.',
        'any.required': 'Please enter your email.'
    }),
    phone: Joi.string().trim().pattern(PHONE_PATTERN).allow('').messages({
        'string.pattern.base': 'Enter a valid 10-digit Indian mobile number.'
    }),
    topic: Joi.string().valid(...CONTACT_TOPIC_KEYS).required().messages({
        'any.only': 'Please choose a topic.',
        'any.required': 'Please choose a topic.'
    }),
    orderNumber: Joi.string().trim().pattern(/^CNS-\d{8}-\d{4}$/i).allow('').messages({
        'string.pattern.base': 'Order numbers look like CNS-20261004-4821.'
    }),
    message: Joi.string().trim().min(10).max(2000).required().messages({
        'string.empty': 'Please write your message.',
        'string.min': 'Please write at least 10 characters.',
        'string.max': 'Your message can be at most 2000 characters.',
        'any.required': 'Please write your message.'
    }),
    // Honeypot (hidden field); any value is accepted here and handled in the service
    website: Joi.string().max(200).allow('')
});

const validateContactMessage = (req, res, next) => {
    const { error } = contactSchema.validate(req.body || {});
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

module.exports = { validateContactMessage };
