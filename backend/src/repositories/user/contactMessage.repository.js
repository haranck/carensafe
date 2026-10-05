const ContactMessage = require('../../models/contactMessage.model');

class ContactMessageRepository {
    async create(data) {
        const message = await ContactMessage.create(data);
        return message.toObject();
    }

    markEmailSent(messageId) {
        return ContactMessage.updateOne({ _id: messageId }, { $set: { emailSent: true } });
    }
}

module.exports = new ContactMessageRepository();
