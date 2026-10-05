require('dotenv').config();

function parseRedisHost(rawHost) {
  const trimmed = rawHost ? rawHost.trim() : '';
  return trimmed || '127.0.0.1';
}

function parseRedisPort(rawPort) {
  if (!rawPort) return 6379;
  const trimmed = rawPort.trim();
  const port = parseInt(trimmed, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid REDIS_PORT: "${rawPort}". Must be a valid TCP port (1-65535).`);
  }
  return port;
}

function parseRedisUrl(rawUrl) {
  const trimmed = rawUrl ? rawUrl.trim() : '';
  if (!trimmed) return '';
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Invalid REDIS_URL. Expected format: redis://username:password@host:port');
  }
  if (parsed.protocol !== 'redis:' && parsed.protocol !== 'rediss:') {
    throw new Error(`Invalid REDIS_URL protocol "${parsed.protocol}". Must be redis:// or rediss://`);
  }
  return trimmed;
}

const MONGO_URI = (process.env.MONGO_URI || '').trim();
if (!MONGO_URI) {
  throw new Error('Missing required environment variable: MONGO_URI');
}

const JWT_ACCESS_SECRET = (process.env.JWT_ACCESS_SECRET || '').trim();
if (!JWT_ACCESS_SECRET) {
  throw new Error('Missing required environment variable: JWT_ACCESS_SECRET');
}

const JWT_REFRESH_SECRET = (process.env.JWT_REFRESH_SECRET || '').trim();
if (!JWT_REFRESH_SECRET) {
  throw new Error('Missing required environment variable: JWT_REFRESH_SECRET');
}

// Razorpay: test keys (rzp_test_...) now, live keys (rzp_live_...) later. Going live needs only env changes.
const RAZORPAY_KEY_ID = (process.env.RAZORPAY_KEY_ID || '').trim();
const RAZORPAY_KEY_SECRET = (process.env.RAZORPAY_KEY_SECRET || '').trim();
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  throw new Error('Missing required environment variables: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
}

function parsePositiveInt(name, rawValue, fallback) {
  const raw = (rawValue || '').trim();
  if (!raw) return fallback;
  const value = parseInt(raw, 10);
  if (isNaN(value) || value <= 0 || String(value) !== raw) {
    throw new Error(`Invalid ${name}: "${rawValue}". Must be a positive whole number.`);
  }
  return value;
}

const REFUND_DESTINATION = (process.env.REFUND_DESTINATION || 'wallet').trim();
if (!['wallet', 'source'].includes(REFUND_DESTINATION)) {
  throw new Error(`Invalid REFUND_DESTINATION: "${REFUND_DESTINATION}". Must be "wallet" or "source".`);
}

const WALLET_TOPUP_MIN = parsePositiveInt('WALLET_TOPUP_MIN', process.env.WALLET_TOPUP_MIN, 100);
const WALLET_TOPUP_MAX = parsePositiveInt('WALLET_TOPUP_MAX', process.env.WALLET_TOPUP_MAX, 10000);
if (WALLET_TOPUP_MIN >= WALLET_TOPUP_MAX) {
  throw new Error('WALLET_TOPUP_MIN must be lower than WALLET_TOPUP_MAX.');
}

const env = {
  NODE_ENV: (process.env.NODE_ENV || 'development').trim(),
  PORT: parseInt((process.env.PORT || '3000').trim(), 10),
  MONGO_URI,
  FRONTEND_URL: (process.env.FRONTEND_URL || 'http://localhost:5173').trim(),
  REDIS_URL: parseRedisUrl(process.env.REDIS_URL),
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: (process.env.JWT_ACCESS_EXPIRES_IN || '15m').trim(),
  JWT_REFRESH_EXPIRES_IN: (process.env.JWT_REFRESH_EXPIRES_IN || process.env.JWT_REFRESH_EXPIRATION || '7d').trim(),
  REFRESH_TOKEN_MAX_AGE: parseInt((process.env.REFRESH_TOKEN_MAX_AGE || '604800000').trim(), 10),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
  CLOUDINARY_API_KEY: (process.env.CLOUDINARY_API_KEY || '').trim(),
  CLOUDINARY_API_SECRET: (process.env.CLOUDINARY_API_SECRET || '').trim(),

  SMTP_HOST: (process.env.SMTP_HOST || '').trim(),
  SMTP_PORT: parseInt((process.env.SMTP_PORT || '587').trim(), 10),
  SMTP_USER: (process.env.SMTP_USER || '').trim(),
  SMTP_PASS: (process.env.SMTP_PASS || '').trim(),
  SMTP_FROM: (process.env.SMTP_FROM || '').trim(),

  // Google OAuth (optional: without both, POST /api/user/auth/google returns 503)
  GOOGLE_CLIENT_ID: (process.env.GOOGLE_CLIENT_ID || '').trim(),
  GOOGLE_CLIENT_SECRET: (process.env.GOOGLE_CLIENT_SECRET || '').trim(),

  // Inbox for Contact page messages (falls back to SMTP_USER)
  CONTACT_EMAIL_TO: (process.env.CONTACT_EMAIL_TO || '').trim(),

  // Razorpay (never log the keys; only RAZORPAY_MODE)
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim(),
  RAZORPAY_MODE: RAZORPAY_KEY_ID.startsWith('rzp_live_') ? 'live' : 'test',
  // Minutes an online-payment order keeps its stock reserved while waiting for payment
  PAYMENT_EXPIRY_MINUTES: parsePositiveInt('PAYMENT_EXPIRY_MINUTES', process.env.PAYMENT_EXPIRY_MINUTES, 15),
  // Where refunds of the ONLINE-paid part go: 'wallet' (instant) or 'source' (Razorpay refund to the original method)
  REFUND_DESTINATION,
  // Wallet top-up limits, in rupees
  WALLET_TOPUP_MIN,
  WALLET_TOPUP_MAX,
};

module.exports = env;
