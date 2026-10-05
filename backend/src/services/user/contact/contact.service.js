const contactMessageRepository = require('../../../repositories/user/contactMessage.repository');
const emailService = require('../auth/email.service');
const { CONTACT_TOPICS } = require('../../../config/contact');
const env = require('../../../config/envValidation');

class ContactService {
    /**
     * Saves the message, emails it to the team inbox (CONTACT_EMAIL_TO, else SMTP_USER) and sends the customer a short
     * acknowledgement. Email problems never lose the message (it's saved first) and never fail the request.
     * `website` is a hidden honeypot field: bots fill it, people don't. Bot messages get the same answer, but nothing
     * is saved or sent.
     */
    async submitMessage({ name, email, phone, topic, orderNumber, message, website }, userId) {
        if (website) return { received: true };

        const saved = await contactMessageRepository.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone?.trim() || undefined,
            topic,
            orderNumber: orderNumber?.trim().toUpperCase() || undefined,
            message: message.trim(),
            ...(userId && { user: userId })
        });

        const details = { ...saved, topicLabel: CONTACT_TOPICS[saved.topic] };
        const inbox = env.CONTACT_EMAIL_TO || env.SMTP_USER;
        try {
            if (inbox && (await emailService.sendContactNotification(inbox, details))) {
                await contactMessageRepository.markEmailSent(saved._id);
            }
        } catch (error) {
            console.error('[Contact] emailing message', String(saved._id), 'failed:', error.message);
        }
        emailService.sendContactAcknowledgement(details).catch((error) => console.error('[Contact] acknowledgement failed:', error.message));

        return { received: true, id: saved._id };
    }
}

module.exports = new ContactService();
