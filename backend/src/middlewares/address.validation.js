const Joi = require('joi');
const { PHONE_PATTERN } = require('./profile.validation');

// India's rough bounding box (pins outside it are rejected)
const INDIA_BOUNDS = { minLat: 6, maxLat: 37, minLng: 68, maxLng: 98 };

const isInIndia = ([lng, lat]) =>
    lat >= INDIA_BOUNDS.minLat && lat <= INDIA_BOUNDS.maxLat && lng >= INDIA_BOUNDS.minLng && lng <= INDIA_BOUNDS.maxLng;

const optionalText = (label, max) =>
    Joi.string().trim().max(max).allow('').messages({ 'string.max': `${label} can be at most ${max} characters.` });

const requiredText = (label, min, max) =>
    Joi.string().trim().min(min).max(max).messages({
        'string.empty': `${label} is required.`,
        'string.min': `${label} must be at least ${min} characters.`,
        'string.max': `${label} can be at most ${max} characters.`,
        'any.required': `${label} is required.`
    });

const fields = {
    fullName: requiredText('Full name', 2, 60),
    phone: Joi.string().trim().pattern(PHONE_PATTERN).messages({
        'string.pattern.base': 'Enter a valid 10-digit Indian mobile number.',
        'string.empty': 'Phone number is required.',
        'any.required': 'Phone number is required.'
    }),
    line1: requiredText('House / flat / building', 3, 120),
    line2: optionalText('Area / street', 120),
    landmark: optionalText('Landmark', 80),
    city: requiredText('City', 2, 50),
    district: optionalText('District', 50),
    state: requiredText('State', 2, 50),
    pincode: Joi.string().trim().pattern(/^[1-9][0-9]{5}$/).messages({
        'string.pattern.base': 'Enter a valid 6-digit pincode.',
        'string.empty': 'Pincode is required.',
        'any.required': 'Pincode is required.'
    }),
    type: Joi.string().valid('Home', 'Work', 'Other').messages({ 'any.only': 'Type must be Home, Work or Other.' }),
    isDefault: Joi.boolean().strict().messages({ 'boolean.base': 'isDefault must be true or false.' }),
    // GeoJSON order: [longitude, latitude]
    location: Joi.object({
        coordinates: Joi.array()
            .ordered(
                Joi.number().min(-180).max(180).required().messages({ 'number.base': 'Longitude must be a number.' }),
                Joi.number().min(-90).max(90).required().messages({ 'number.base': 'Latitude must be a number.' })
            )
            .length(2)
            .required()
            .custom((coordinates, helpers) => (isInIndia(coordinates) ? coordinates : helpers.error('location.outsideIndia')))
            .messages({
                'array.base': 'Location coordinates must be [longitude, latitude].',
                'array.length': 'Location coordinates must be [longitude, latitude].',
                'array.orderedLength': 'Location coordinates must be [longitude, latitude].',
                'array.includesRequiredUnknowns': 'Location coordinates must be [longitude, latitude].',
                'number.min': 'Location coordinates are out of range.',
                'number.max': 'Location coordinates are out of range.',
                'location.outsideIndia': 'Location must be within India.',
                'any.required': 'Location coordinates are required.'
            })
    }),
    formattedAddress: optionalText('Formatted address', 300)
};

const REQUIRED = ['fullName', 'phone', 'line1', 'city', 'state', 'pincode'];

const createAddressSchema = Joi.object(fields).fork(REQUIRED, (schema) => schema.required());
const updateAddressSchema = Joi.object(fields).min(1).messages({ 'object.min': 'Nothing to update.' });

const addressIdSchema = Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid address id.',
    'string.length': 'Invalid address id.',
    'any.required': 'Address id is required.'
});

const validateCreateAddress = (req, res, next) => {
    const { error } = createAddressSchema.validate(req.body || {});
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

const validateUpdateAddress = (req, res, next) => {
    const { error } = updateAddressSchema.validate(req.body || {});
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

const validateAddressId = (req, res, next) => {
    const { error } = addressIdSchema.validate(req.params.id);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

module.exports = { validateCreateAddress, validateUpdateAddress, validateAddressId };
