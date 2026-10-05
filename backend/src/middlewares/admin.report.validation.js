const Joi = require('joi');
const { REPORT_PERIODS } = require('../utils/report');
const { page, limit, validateWith } = require('./order.validation');

// Custom ranges: both days required, "to" not before "from", at most ~5 years
const customDay = (label) =>
    Joi.when('period', {
        is: 'custom',
        then: Joi.date().iso().required(),
        otherwise: Joi.any().strip()
    }).messages({
        'any.required': `${label} date is required for a custom range.`,
        'date.base': `${label} must be a date.`,
        'date.format': `${label} must be a date (YYYY-MM-DD).`
    });

const periodFields = {
    period: Joi.string()
        .valid(...REPORT_PERIODS)
        .default('monthly')
        .messages({ 'any.only': 'Period must be daily, weekly, monthly, yearly or custom.' }),
    from: customDay('From'),
    to: customDay('To').concat(
        Joi.when('period', {
            is: 'custom',
            then: Joi.date().min(Joi.ref('from')).max(Joi.ref('from', { adjust: (from) => new Date(new Date(from).getTime() + 5 * 366 * 24 * 60 * 60 * 1000) })),
            otherwise: Joi.any()
        })
    ).messages({
        'date.min': '"To" date cannot be before the "From" date.',
        'date.max': 'A custom range can cover at most 5 years.'
    })
};

const salesQuerySchema = Joi.object({ ...periodFields, page, limit: limit(100) });
const salesExportQuerySchema = Joi.object(periodFields);

module.exports = {
    validateSalesQuery: validateWith(salesQuerySchema, 'query'),
    validateSalesExportQuery: validateWith(salesExportQuerySchema, 'query')
};
