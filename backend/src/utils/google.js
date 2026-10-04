const { OAuth2Client } = require('google-auth-library');
const env = require('../config/envValidation');

class GoogleUtil {
    constructor() {
        // 'postmessage' is the redirect URI for codes from the frontend popup (useGoogleLogin auth-code flow)
        this.client = env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
            ? new OAuth2Client({
                clientId: env.GOOGLE_CLIENT_ID,
                clientSecret: env.GOOGLE_CLIENT_SECRET,
                redirectUri: 'postmessage'
            })
            : null;
    }

    // Exchanges the authorization code and returns the verified id_token payload
    // (sub, email, email_verified, given_name, family_name, picture, ...)
    async verifyGoogleCode(code) {
        if (!this.client) {
            const error = new Error('Google sign-in is not available right now.');
            error.statusCode = 503;
            throw error;
        }

        try {
            const { tokens } = await this.client.getToken(code);
            if (!tokens.id_token) {
                throw new Error('No id_token in Google token response');
            }

            const ticket = await this.client.verifyIdToken({
                idToken: tokens.id_token,
                audience: env.GOOGLE_CLIENT_ID
            });
            return ticket.getPayload();
        } catch (err) {
            console.error('[Google Auth]', err.message);
            const error = new Error('Google authentication failed.');
            error.statusCode = 401;
            throw error;
        }
    }
}

module.exports = new GoogleUtil();
