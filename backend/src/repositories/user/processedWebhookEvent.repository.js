const ProcessedWebhookEvent = require('../../models/processedWebhookEvent.model');

class ProcessedWebhookEventRepository {
    exists(eventId) {
        return ProcessedWebhookEvent.exists({ eventId });
    }

    // Throws a duplicate key error (11000) if the event was already recorded
    async create(eventId, event, session) {
        const [doc] = await ProcessedWebhookEvent.create([{ eventId, event }], { session });
        return doc.toObject();
    }
}

module.exports = new ProcessedWebhookEventRepository();
