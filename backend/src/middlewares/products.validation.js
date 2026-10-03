const Joi = require('joi');

const productQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).messages({
        'number.base': 'Page must be a number.',
        'number.min': 'Page must be at least 1.'
    }),
    limit: Joi.number().integer().min(1).max(48).messages({
        'number.base': 'Limit must be a number.',
        'number.min': 'Limit must be at least 1.',
        'number.max': 'Limit cannot exceed 48.'
    }),
    search: Joi.string().trim().max(100).allow('').messages({
        'string.max': 'Search must be at most 100 characters.'
    }),
    // Categories come from GET /filters, so only the format is checked here
    category: Joi.string().pattern(/^[a-z_]{1,50}$/).messages({
        'string.pattern.base': 'Invalid category.'
    }),
    combo: Joi.string().valid('true', 'false').messages({
        'any.only': 'Combo must be true or false.'
    }),
    inStock: Joi.string().valid('true', 'false').messages({
        'any.only': 'In stock must be true or false.'
    }),
    sizes: Joi.string().max(100).pattern(/^[A-Za-z0-9/ ]+(,[A-Za-z0-9/ ]+)*$/).messages({
        'string.max': 'Too many sizes.',
        'string.pattern.base': 'Sizes must be a comma-separated list, e.g. L,XL.'
    }),
    minPrice: Joi.number().min(0).messages({
        'number.base': 'Min price must be a number.',
        'number.min': 'Min price cannot be negative.'
    }),
    maxPrice: Joi.number()
        .min(0)
        .when('minPrice', { is: Joi.exist(), then: Joi.number().min(Joi.ref('minPrice')) })
        .messages({
            'number.base': 'Max price must be a number.',
            'number.min': 'Max price must be at least the min price.'
        }),
    sort: Joi.string().valid('newest', 'name_asc', 'name_desc', 'price_asc', 'price_desc').messages({
        'any.only': 'Invalid sort option.'
    })
});

const productIdSchema = Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid product id.',
    'string.length': 'Invalid product id.'
});

const similarQuerySchema = Joi.object({
    limit: Joi.number().integer().min(1).max(20).messages({
        'number.base': 'Limit must be a number.',
        'number.min': 'Limit must be at least 1.',
        'number.max': 'Limit cannot exceed 20.'
    })
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

const validateSimilarQuery = (req, res, next) => {
    const { error } = similarQuerySchema.validate(req.query);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

module.exports = { validateProductQuery, validateProductId, validateSimilarQuery };
