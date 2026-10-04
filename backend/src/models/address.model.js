const mongoose = require('mongoose');

// Saved delivery addresses: one document per address (max per user in config/addresses.js)
const addressSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        fullName: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true,
            match: /^[6-9]\d{9}$/
        },

        // House / flat / building
        line1: {
            type: String,
            required: true,
            trim: true
        },

        // Area / street
        line2: {
            type: String,
            trim: true
        },

        landmark: {
            type: String,
            trim: true
        },

        city: {
            type: String,
            required: true,
            trim: true
        },

        district: {
            type: String,
            trim: true
        },

        state: {
            type: String,
            required: true,
            trim: true
        },

        pincode: {
            type: String,
            required: true,
            trim: true,
            match: /^[1-9][0-9]{5}$/
        },

        country: {
            type: String,
            default: 'India',
            trim: true
        },

        type: {
            type: String,
            enum: ['Home', 'Work', 'Other'],
            default: 'Home'
        },

        isDefault: {
            type: Boolean,
            default: false
        },

        // Optional map pin (GeoJSON, so coordinates are [longitude, latitude])
        location: {
            type: {
                type: String,
                enum: ['Point']
            },
            coordinates: {
                type: [Number],
                default: undefined
            }
        },

        // Mapbox's full address for the pin
        formattedAddress: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

// The user's list: default first, then newest
addressSchema.index({ user: 1, isDefault: -1, createdAt: -1 });
// Only addresses with a pin
addressSchema.index({ location: '2dsphere' }, { sparse: true });

module.exports = mongoose.model('Address', addressSchema);
