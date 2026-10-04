const Joi = require('joi');
const { USER_CANCEL_REASONS, STATUS_GROUPS } = require('../config/orders');

const objectId = (label) =>
    Joi.string().hex().length(24).messages({
        'string.base': `Invalid ${label} id.`,
        'string.empty': `${label[0].toUpperCase()}${label.slice(1)} id is required.`,
        'string.hex': `Invalid ${label} id.`,
        'string.length': `Invalid ${label} id.`,
        'any.required': `${label[0].toUpperCase()}${label.slice(1)} id is required.`
    });

const note = Joi.string().trim().max(300).allow('').messages({ 'string.max': 'Note can be at most 300 characters.' });

const page = Joi.number().integer().min(1).messages({ 'number.base': 'Page must be a number.', 'number.min': 'Page must be at least 1.' });
const limit = (max) =>
    Joi.number().integer().min(1).max(max).messages({ 'number.base': 'Limit must be a number.', 'number.max': `Limit can be at most ${max}.` });

// paymentMethod razorpay + useWallet = wallet first, the rest online. idempotencyKey: one per checkout attempt (the
// client keeps it until success), so retries / double clicks return the same order.
const placeOrderSchema = Joi.object({
    addressId: objectId('address').required(),
    paymentMethod: Joi.string().valid('cod', 'razorpay', 'wallet').required().messages({
        'any.only': 'Choose a valid payment method.',
        'any.required': 'Choose a payment method.'
    }),
    useWallet: Joi.boolean().strict().messages({ 'boolean.base': 'useWallet must be true or false.' }),
    idempotencyKey: Joi.string()
        .pattern(/^[A-Za-z0-9-]{8,64}$/)
        .required()
        .messages({ 'string.pattern.base': 'Invalid checkout attempt id.', 'any.required': 'A checkout attempt id is required.' })
});

const myOrdersQuerySchema = Joi.object({
    page,
    limit: limit(50),
    status: Joi.string().valid(...Object.keys(STATUS_GROUPS)).allow('').messages({
        'any.only': `Status must be one of: ${Object.keys(STATUS_GROUPS).join(', ')}.`
    })
});

const cancelSchema = Joi.object({
    reason: Joi.string().valid(...USER_CANCEL_REASONS).required().messages({
        'any.only': 'Choose a valid cancellation reason.',
        'any.required': 'Choose a reason for cancelling.',
        'string.empty': 'Choose a reason for cancelling.'
    }),
    note
});

// The unopened-pack check itself lives in the service (400 'Returns are accepted only for unopened packs.')
const returnSchema = Joi.object({
    note,
    packUnopenedConfirmed: Joi.boolean().strict().required().messages({
        'boolean.base': 'packUnopenedConfirmed must be true or false.',
        'any.required': 'Returns are accepted only for unopened packs.'
    })
});

const validateWith = (schema, source = 'body') => (req, res, next) => {
    const { error } = schema.validate(req[source] || {});
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

const validateOrderParams = (req, res, next) => {
    const { error } = objectId('order').required().validate(req.params.id);
    const itemResult = req.params.itemId === undefined ? {} : objectId('item').required().validate(req.params.itemId);
    const failed = error || itemResult.error;
    if (failed) {
        return res.status(400).json({ success: false, message: failed.details[0].message });
    }
    next();
};

module.exports = {
    objectId,
    note,
    page,
    limit,
    cancelSchema,
    validateWith,
    validateOrderParams,
    validatePlaceOrder: validateWith(placeOrderSchema),
    validateMyOrdersQuery: validateWith(myOrdersQuerySchema, 'query'),
    validateCancelOrder: validateWith(cancelSchema),
    validateReturnOrder: validateWith(returnSchema)
};
