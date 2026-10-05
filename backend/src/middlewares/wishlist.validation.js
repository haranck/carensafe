const Joi = require('joi');

const objectId = (label) =>
    Joi.string().hex().length(24).messages({
        'string.base': `Invalid ${label} id.`,
        'string.empty': `${label[0].toUpperCase()}${label.slice(1)} id is required.`,
        'string.hex': `Invalid ${label} id.`,
        'string.length': `Invalid ${label} id.`,
        'any.required': `${label[0].toUpperCase()}${label.slice(1)} id is required.`
    });

// Each size is saved separately: the variant is required
const addToWishlistSchema = Joi.object({
    productId: objectId('product').required(),
    variantId: objectId('variant').required()
});

const itemIdSchema = objectId('wishlist item').required();

const wishlistQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).messages({
        'number.base': 'Page must be a number.',
        'number.min': 'Page must be at least 1.'
    }),
    limit: Joi.number().integer().min(1).max(48).messages({
        'number.base': 'Limit must be a number.',
        'number.min': 'Limit must be at least 1.',
        'number.max': 'Limit cannot exceed 48.'
    })
});

const validateAddToWishlist = (req, res, next) => {
    const { error } = addToWishlistSchema.validate(req.body || {});
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

const validateWishlistItemId = (req, res, next) => {
    const { error } = itemIdSchema.validate(req.params.itemId);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

const validateWishlistQuery = (req, res, next) => {
    const { error } = wishlistQuerySchema.validate(req.query);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

module.exports = { validateAddToWishlist, validateWishlistItemId, validateWishlistQuery };
