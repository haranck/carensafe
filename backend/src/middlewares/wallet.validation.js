const Joi = require('joi');

const transactionsQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).messages({ 'number.base': 'Page must be a number.', 'number.min': 'Page must be at least 1.' }),
    limit: Joi.number().integer().min(1).max(50).messages({ 'number.base': 'Limit must be a number.', 'number.max': 'Limit can be at most 50.' }),
    type: Joi.string().valid('credit', 'debit').allow('').messages({ 'any.only': 'Type must be credit or debit.' })
});

const validateTransactionsQuery = (req, res, next) => {
    const { error } = transactionsQuerySchema.validate(req.query || {});
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

module.exports = { validateTransactionsQuery };
