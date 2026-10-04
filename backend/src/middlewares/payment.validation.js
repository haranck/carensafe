const Joi = require('joi');

const razorpayOrderId = Joi.string().pattern(/^order_[A-Za-z0-9]{6,40}$/).required().messages({
    'string.pattern.base': 'Invalid payment order id.',
    'any.required': 'Payment order id is required.'
});

const verifySchema = Joi.object({
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: Joi.string().pattern(/^pay_[A-Za-z0-9]{6,40}$/).required().messages({
        'string.pattern.base': 'Invalid payment id.',
        'any.required': 'Payment id is required.'
    }),
    razorpay_signature: Joi.string().hex().length(64).required().messages({
        'string.hex': 'Invalid payment signature.',
        'string.length': 'Invalid payment signature.',
        'any.required': 'Payment signature is required.'
    })
});

const text = Joi.string().max(300).allow('');

// The popup's payment.failed `error` object (only what we store)
const failedSchema = Joi.object({
    razorpay_order_id: razorpayOrderId,
    error: Joi.object({
        code: text,
        description: text,
        reason: text,
        source: text,
        step: text,
        metadata: Joi.object({ payment_id: text, order_id: text }).unknown(true)
    })
        .unknown(true)
        .default({})
});

const validateBody = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body || {});
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

module.exports = {
    validateVerifyPayment: validateBody(verifySchema),
    validatePaymentFailed: validateBody(failedSchema)
};
