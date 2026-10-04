const crypto = require('crypto');
const Razorpay = require('razorpay');
const env = require('../config/envValidation');

const CURRENCY = 'INR';

const client = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });

// Razorpay's own errors never reach the client (codes / descriptions stay in the server log)
const providerError = () => {
    const error = new Error('Payment provider error, please try again.');
    error.statusCode = 502;
    return error;
};

const call = async (label, fn) => {
    try {
        return await fn();
    } catch (error) {
        console.error(`[Razorpay] ${label} failed:`, error?.statusCode || '', error?.error?.code || '', error?.error?.description || error?.message || '');
        throw providerError();
    }
};

// Constant-time comparison of two hex HMACs (lengths first: timingSafeEqual throws on different lengths)
const safeEqualHex = (expected, received) => {
    if (typeof received !== 'string' || received.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(received, 'utf8'));
};

const hmac = (secret, payload) => crypto.createHmac('sha256', secret).update(payload).digest('hex');

/**
 * Thin wrapper around the Razorpay SDK. Amounts are integer PAISE. Services call these through this module object,
 * so tests can replace them.
 */
const razorpayUtil = {
    keyId: env.RAZORPAY_KEY_ID,
    mode: env.RAZORPAY_MODE,
    currency: CURRENCY,

    // receipt: max 40 chars; notes: up to 15 string pairs
    createOrder({ amountPaise, receipt, notes }) {
        return call('createOrder', () => client.orders.create({ amount: amountPaise, currency: CURRENCY, receipt, notes }));
    },

    fetchPayment(paymentId) {
        return call('fetchPayment', () => client.payments.fetch(paymentId));
    },

    // Every payment attempt made against a Razorpay order: { items: [...] }
    async fetchOrderPayments(orderId) {
        const result = await call('fetchOrderPayments', () => client.orders.fetchPayments(orderId));
        return result?.items || [];
    },

    capturePayment(paymentId, amountPaise) {
        return call('capturePayment', () => client.payments.capture(paymentId, amountPaise, CURRENCY));
    },

    // notes.refundKey identifies our refund, so a retried job can find a refund that was already created
    createRefund(paymentId, { amountPaise, receipt, notes }) {
        return call('createRefund', () => client.payments.refund(paymentId, { amount: amountPaise, receipt, notes, speed: 'normal' }));
    },

    async fetchRefunds(paymentId) {
        const result = await call('fetchRefunds', () => client.payments.fetchMultipleRefund(paymentId, { count: 100 }));
        return result?.items || [];
    },

    fetchRefund(paymentId, refundId) {
        return call('fetchRefund', () => client.payments.fetchRefund(paymentId, refundId));
    },

    // Checkout success handler: HMAC-SHA256 of "<order_id>|<payment_id>" with the key secret
    verifyPaymentSignature({ orderId, paymentId, signature }) {
        if (!orderId || !paymentId) return false;
        return safeEqualHex(hmac(env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`), signature);
    },

    // Webhooks: HMAC-SHA256 of the RAW request body with the webhook secret
    verifyWebhookSignature(rawBody, signature) {
        if (!env.RAZORPAY_WEBHOOK_SECRET || !Buffer.isBuffer(rawBody)) return false;
        return safeEqualHex(hmac(env.RAZORPAY_WEBHOOK_SECRET, rawBody), signature);
    }
};

module.exports = razorpayUtil;
