const Joi = require('joi');
const { ORDER_STATUSES, PAYMENT_STATUSES } = require('../config/orders');
const { note, page, limit, cancelSchema, validateWith } = require('./order.validation');

const isoDate = (label) =>
    Joi.date().iso().allow('').messages({ 'date.base': `${label} must be a date.`, 'date.format': `${label} must be a date (YYYY-MM-DD).` });

const listOrdersQuerySchema = Joi.object({
    page,
    limit: limit(100),
    search: Joi.string().trim().max(100).allow('').messages({ 'string.max': 'Search can be at most 100 characters.' }),
    orderStatus: Joi.string().valid(...ORDER_STATUSES).allow('').messages({ 'any.only': 'Unknown order status.' }),
    paymentStatus: Joi.string().valid(...PAYMENT_STATUSES).allow('').messages({ 'any.only': 'Unknown payment status.' }),
    from: isoDate('From'),
    to: isoDate('To'),
    hasReturnRequest: Joi.string().valid('true', 'false').allow('').messages({ 'any.only': 'hasReturnRequest must be true or false.' })
});

const returnsQuerySchema = Joi.object({ page, limit: limit(100) });

const shippedOnly = (schema, message) =>
    Joi.when('status', {
        is: 'shipped',
        then: schema.required().messages({ 'any.required': message, 'string.empty': message }),
        otherwise: schema.allow('')
    });

const updateStatusSchema = Joi.object({
    status: Joi.string().valid(...ORDER_STATUSES).required().messages({
        'any.only': 'Unknown order status.',
        'any.required': 'Status is required.'
    }),
    note,
    courier: shippedOnly(
        Joi.string().trim().max(60).messages({ 'string.max': 'Courier can be at most 60 characters.' }),
        'Courier is required to mark an order as shipped.'
    ),
    trackingNumber: shippedOnly(
        Joi.string().trim().max(60).messages({ 'string.max': 'Tracking number can be at most 60 characters.' }),
        'Tracking number is required to mark an order as shipped.'
    ),
    trackingUrl: Joi.string().trim().uri({ scheme: ['http', 'https'] }).max(500).allow('').messages({
        'string.uri': 'Tracking link must be a valid http(s) URL.'
    }),
    expectedDelivery: isoDate('Expected delivery')
});

const decideReturnSchema = Joi.object({
    decision: Joi.string().valid('approved', 'rejected').required().messages({
        'any.only': 'Decision must be approved or rejected.',
        'any.required': 'Decision is required.'
    }),
    adminReason: Joi.when('decision', {
        is: 'rejected',
        then: Joi.string().trim().min(5).max(300).required().messages({
            'any.required': 'A reason is required to reject a return.',
            'string.empty': 'A reason is required to reject a return.',
            'string.min': 'The reason must be at least 5 characters.'
        }),
        otherwise: Joi.string().trim().max(300).allow('')
    }).messages({ 'string.max': 'The reason can be at most 300 characters.' })
});

module.exports = {
    validateListOrdersQuery: validateWith(listOrdersQuerySchema, 'query'),
    validateReturnsQuery: validateWith(returnsQuerySchema, 'query'),
    validateUpdateStatus: validateWith(updateStatusSchema),
    validateAdminCancel: validateWith(cancelSchema),
    validateDecideReturn: validateWith(decideReturnSchema)
};
