const Joi = require('joi');
const env = require('../config/envValidation');

const transactionsQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).messages({ 'number.base': 'Page must be a number.', 'number.min': 'Page must be at least 1.' }),
    limit: Joi.number().integer().min(1).max(50).messages({ 'number.base': 'Limit must be a number.', 'number.max': 'Limit can be at most 50.' }),
    type: Joi.string().valid('credit', 'debit').allow('').messages({ 'any.only': 'Type must be credit or debit.' })
});

// Rupees, whole numbers, within the configured limits
const topupSchema = Joi.object({
    amount: Joi.number()
        .strict()
        .integer()
        .min(env.WALLET_TOPUP_MIN)
        .max(env.WALLET_TOPUP_MAX)
        .required()
        .messages({
            'number.base': 'Amount must be a number.',
            'number.integer': 'Amount must be a whole number of rupees.',
            'number.min': `Add at least ₹${env.WALLET_TOPUP_MIN}.`,
            'number.max': `You can add up to ₹${env.WALLET_TOPUP_MAX} at a time.`,
            'any.required': 'Amount is required.'
        })
});

const validateTopup = (req, res, next) => {
    const { error } = topupSchema.validate(req.body || {});
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

const validateTransactionsQuery = (req, res, next) => {
    const { error } = transactionsQuerySchema.validate(req.query || {});
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

module.exports = { validateTransactionsQuery, validateTopup };
