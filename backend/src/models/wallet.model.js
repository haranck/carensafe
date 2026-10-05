const mongoose = require('mongoose');

// One wallet per user, created on first use. Money is integer PAISE (₹1 = 100); convert only for display.
const walletSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },

        balance: {
            type: Number,
            default: 0,
            min: 0,
            validate: { validator: Number.isInteger, message: 'Balance must be whole paise.' }
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Wallet', walletSchema);
