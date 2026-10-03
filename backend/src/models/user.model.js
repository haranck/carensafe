const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true
        },

        lastName: {
            type: String,
            trim: true
        },

        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: false
        },

        phone: {
            type: String,
            trim: true
        },

        isBlocked: {
            type: Boolean,
            default: false
        },

        avatarUrl: {
            type: String
        },

        isAdmin: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('User', userSchema);