const Joi = require('joi');

const productQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).messages({
        'number.base': 'Page must be a number.',
        'number.min': 'Page must be at least 1.'
    }),
    limit: Joi.number().integer().min(1).max(50).messages({
        'number.base': 'Limit must be a number.',
        'number.min': 'Limit must be at least 1.',
        'number.max': 'Limit cannot exceed 50.'
    }),
    search: Joi.string().trim().max(100).allow('').messages({
        'string.max': 'Search must be at most 100 characters.'
    }),
    category: Joi.string().valid('sanitary_pads', 'combo_packs').messages({
        'any.only': 'Invalid category.'
    }),
    sort: Joi.string().valid('newest', 'price_asc', 'price_desc').messages({
        'any.only': 'Invalid sort option.'
    })
});

const productIdSchema = Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid product id.',
    'string.length': 'Invalid product id.'
});

const validateProductQuery = (req, res, next) => {
    const { error } = productQuerySchema.validate(req.query);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

const validateProductId = (req, res, next) => {
    const { error } = productIdSchema.validate(req.params.id);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

module.exports = { validateProductQuery, validateProductId };
