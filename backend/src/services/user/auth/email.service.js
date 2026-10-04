const transporter = require("../../../config/mail");

const sendTestEmail = async () => {
    const mailOptions = {
        from: process.env.SMTP_FROM || process.env.EMAIL_FROM,
        to: "[EMAIL_ADDRESS]",
        subject: "Carensafe SMTP Test",
        text: "SMTP is working successfully!",
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent:", info.messageId);
};

const sendOtpEmail = async (email, otp) => {
    // Log OTP to console for easy testing/debugging
    console.log(`[Console] Generated OTP for ${email} is: ${otp}`);

    try {
        if (!process.env.SMTP_USER) {
            console.log(`[Mock Email] SMTP_USER not set, skipping real email send.`);
            return;
        }

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.EMAIL_FROM || '"CareNSafe Support" <support@carensafe.com>',
            to: email,
            subject: "Your CareNSafe Verification Code",
            text: `Your verification code is: ${otp}. It will expire in 5 minutes.`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="cid:logo" alt="CareNSafe Logo" style="max-width: 150px; height: auto;" />
                </div>
                <h2 style="color: #333333; text-align: center; font-size: 24px; margin-bottom: 20px;">Verify Your Email Address</h2>
                <p style="color: #555555; font-size: 16px; line-height: 1.6;">
                    Hello,
                </p>
                <p style="color: #555555; font-size: 16px; line-height: 1.6;">
                    Thank you for choosing CareNSafe! Please use the following One-Time Password (OTP) to complete your action.
                </p>
                <div style="text-align: center; margin: 35px 0;">
                    <span style="display: inline-block; padding: 15px 40px; font-size: 28px; font-weight: bold; color: #ffffff; background-color: #0066cc; border-radius: 6px; letter-spacing: 4px;">
                        ${otp}
                    </span>
                </div>
                <p style="color: #555555; font-size: 16px; line-height: 1.6; text-align: center;">
                    This code will expire in <strong>5 minutes</strong>.
                </p>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;" />
                <p style="color: #999999; font-size: 14px; text-align: center; line-height: 1.5;">
                    If you didn't request this email, please safely ignore it or contact our support team.
                </p>
            </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email] OTP sent to ${email}, messageId: ${info.messageId}`);
    } catch (error) {
        console.error('[Email Error] Failed to send OTP email:', error);
        throw new Error('Failed to send verification email.');
    }
};

// Customer text goes into HTML emails: escape it (no markup / links injected through the contact form)
const escapeHtml = (value = '') =>
    String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const fromAddress = () => process.env.SMTP_FROM || process.env.EMAIL_FROM || '"CareNSafe Support" <support@carensafe.com>';

// Contact page → the team's inbox. Reply-To is the customer, so "Reply" answers them directly.
const sendContactNotification = async (to, { name, email, phone, topicLabel, orderNumber, message, createdAt }) => {
    if (!process.env.SMTP_USER) {
        console.log(`[Mock Email] SMTP_USER not set, contact message from ${email} not emailed.`);
        return false;
    }
    const rows = [
        ['Name', name],
        ['Email', email],
        ['Phone', phone || '—'],
        ['Topic', topicLabel],
        ['Order number', orderNumber || '—'],
        ['Received', new Date(createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })]
    ];
    await transporter.sendMail({
        from: fromAddress(),
        to,
        replyTo: `"${name.replace(/"/g, '')}" <${email}>`,
        subject: `Contact: ${topicLabel} — ${name}`,
        text: `${rows.map(([label, value]) => `${label}: ${value}`).join('\n')}\n\n${message}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #f3d6e7; border-radius: 12px;">
                <h2 style="color: #1e1a3a; margin: 0 0 16px;">New message from the website</h2>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    ${rows
                        .map(
                            ([label, value]) =>
                                `<tr><td style="padding: 6px 8px; color: #6b7280; width: 140px;">${label}</td><td style="padding: 6px 8px; color: #1e1a3a; font-weight: bold;">${escapeHtml(value)}</td></tr>`
                        )
                        .join('')}
                </table>
                <div style="margin-top: 16px; padding: 16px; background: #fff5fa; border-radius: 8px; color: #1e1a3a; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</div>
                <p style="margin-top: 16px; color: #9ca3af; font-size: 12px;">Reply to this email to answer ${escapeHtml(name)} directly.</p>
            </div>`
    });
    return true;
};

// Contact page → a short "we got your message" to the customer
const sendContactAcknowledgement = async ({ name, email, topicLabel }) => {
    if (!process.env.SMTP_USER) return false;
    await transporter.sendMail({
        from: fromAddress(),
        to: email,
        subject: 'We received your message — Care N Safe',
        text: `Hi ${name},\n\nThanks for reaching out about "${topicLabel}". Our team will reply within 1 working day.\n\nCare N Safe`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #f3d6e7; border-radius: 12px; color: #1e1a3a;">
                <h2 style="margin: 0 0 12px;">Thanks, ${escapeHtml(name)}!</h2>
                <p style="font-size: 15px; line-height: 1.6;">We received your message about <strong>${escapeHtml(topicLabel)}</strong>. Our team will reply within <strong>1 working day</strong>.</p>
                <p style="font-size: 14px; line-height: 1.6; color: #6b7280;">Need us sooner? Call 1800-CARE-SAFE (toll-free).</p>
                <p style="margin-top: 20px; font-size: 14px;">With care,<br/>Team Care N Safe</p>
            </div>`
    });
    return true;
};

module.exports = {
    sendTestEmail,
    sendOtpEmail,
    sendContactNotification,
    sendContactAcknowledgement,
};