const nodemailer = require('nodemailer');

class EmailUtil {
    constructor() {
        this.transporter = nodemailer.createTransport({
            // Configure this with your actual email provider details
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true', 
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendOtpEmail(toEmail, otp) {
        try {
            // For testing purposes, if SMTP_USER is not set, just log it.
            if (!process.env.SMTP_USER) {
                console.log(`[Mock Email] Sending OTP ${otp} to ${toEmail}`);
                return;
            }

            const mailOptions = {
                from: process.env.EMAIL_FROM || '"CareNSafe Support" <support@carensafe.com>',
                to: toEmail,
                subject: 'Your CareNSafe Verification Code',
                text: `Your verification code is: ${otp}. It will expire in 30 seconds.`,
                html: `<p>Your verification code is: <strong>${otp}</strong></p><p>It will expire in 30 seconds.</p>`,
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`[Email] OTP sent to ${toEmail}`);
        } catch (error) {
            console.error('[Email Error] Failed to send OTP email:', error);
            // Optionally throw error if you want signup to fail when email fails
            throw new Error('Failed to send verification email.');
        }
    }
}

module.exports = new EmailUtil();
