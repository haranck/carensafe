const Joi = require('joi');
const { MAX_ITEM_QUANTITY } = require('../config/cart');

const objectId = (label) =>
    Joi.string().hex().length(24).messages({
        'string.base': `Invalid ${label} id.`,
        'string.empty': `${label[0].toUpperCase()}${label.slice(1)} id is required.`,
        'string.hex': `Invalid ${label} id.`,
        'string.length': `Invalid ${label} id.`,
        'any.required': `${label[0].toUpperCase()}${label.slice(1)} id is required.`
    });

// strict: "2" is rejected, so the service always gets a real number
const quantity = Joi.number().strict().integer().min(1).max(MAX_ITEM_QUANTITY).messages({
    'number.base': 'Quantity must be a number.',
    'number.integer': 'Quantity must be a whole number.',
    'number.min': 'Quantity must be at least 1.',
    'number.max': `You can buy up to ${MAX_ITEM_QUANTITY} of this item.`,
    'any.required': 'Quantity is required.'
});

const addCartItemSchema = Joi.object({
    productId: objectId('product').required(),
    variantId: objectId('variant').required(),
    quantity
});

const updateCartItemSchema = Joi.object({
    quantity: quantity.required()
});

const cartItemIdSchema = objectId('cart item').required();

const validateAddCartItem = (req, res, next) => {
    const { error } = addCartItemSchema.validate(req.body || {});
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

const validateUpdateCartItem = (req, res, next) => {
    const { error } = updateCartItemSchema.validate(req.body || {});
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

const validateCartItemId = (req, res, next) => {
    const { error } = cartItemIdSchema.validate(req.params.itemId);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

module.exports = { validateAddCartItem, validateUpdateCartItem, validateCartItemId };
