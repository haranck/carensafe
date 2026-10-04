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

module.exports = {
    sendTestEmail,
    sendOtpEmail,
};