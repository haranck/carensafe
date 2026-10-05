const contactService = require('../../../services/user/contact/contact.service');
const jwtUtil = require('../../../utils/jwt');

// Logged-in sender's id if a valid token came with the request (the form is public; the id is only attached)
const optionalUserId = (req) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return null;
    try {
        return jwtUtil.verifyAccessToken(header.split(' ')[1]).userId;
    } catch {
        return null;
    }
};

class ContactController {
    async submitMessage(req, res) {
        try {
            const { name, email, phone, topic, orderNumber, message, website } = req.body;
            const result = await contactService.submitMessage({ name, email, phone, topic, orderNumber, message, website }, optionalUserId(req));
            return res.status(201).json({
                success: true,
                message: "Thanks! We've received your message and will reply within 1 working day.",
                data: { received: result.received }
            });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }
}

module.exports = new ContactController();
