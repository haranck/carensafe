const mongoose = require('mongoose');

// Razorpay webhook events already applied (x-razorpay-event-id). Written in the same transaction as the event's
// effects, so a redelivered event is applied exactly once. Kept 30 days.
const processedWebhookEventSchema = new mongoose.Schema(
    {
        eventId: { type: String, required: true, unique: true },
        event: { type: String, required: true },
        createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 }
    },
    { timestamps: false }
);

module.exports = mongoose.model('ProcessedWebhookEvent', processedWebhookEventSchema);
