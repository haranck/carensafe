const mongoose = require('mongoose');
const { CONTACT_TOPIC_KEYS } = require('../config/contact');

// Messages from the Contact page. Saved first, so nothing is lost if the email can't be sent.
const contactMessageSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        phone: { type: String, trim: true },
        topic: { type: String, enum: CONTACT_TOPIC_KEYS, required: true },
        orderNumber: { type: String, trim: true },
        message: { type: String, required: true, trim: true },
        // Logged-in sender, if any
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emailSent: { type: Boolean, default: false },
        status: { type: String, enum: ['new', 'read', 'replied'], default: 'new' }
    },
    {
        timestamps: true
    }
);

contactMessageSchema.index({ createdAt: -1 });
contactMessageSchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
