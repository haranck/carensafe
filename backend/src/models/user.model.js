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

        // Google-only accounts have no password
        password: {
            type: String,
            required: [function () { return this.authProvider === 'local'; }, 'Password is required']
        },

        googleId: {
            type: String,
            unique: true,
            sparse: true
        },

        authProvider: {
            type: String,
            enum: ['local', 'google'],
            default: 'local'
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

        // Cloudinary id of an uploaded avatar (none for Google photos), so it can be deleted when replaced
        avatarPublicId: {
            type: String
        },

        isAdmin: {
            type: Boolean,
            default: false
        },

        // Customer sessions (access and refresh tokens) issued before this moment are rejected: set on password reset
        // and when a stolen refresh token is detected, which logs the account out on every device
        tokensValidAfter: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('User', userSchema);