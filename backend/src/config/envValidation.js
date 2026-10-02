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

const env = {
  NODE_ENV: (process.env.NODE_ENV || 'development').trim(),
  PORT: parseInt((process.env.PORT || '3000').trim(), 10),
  MONGO_URI,
  FRONTEND_URL: (process.env.FRONTEND_URL || 'http://localhost:5173').trim(),
  REDIS_HOST: parseRedisHost(process.env.REDIS_HOST),
  REDIS_PORT: parseRedisPort(process.env.REDIS_PORT),
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: (process.env.JWT_ACCESS_EXPIRES_IN || '15m').trim(),
  JWT_REFRESH_EXPIRES_IN: (process.env.JWT_REFRESH_EXPIRES_IN || process.env.JWT_REFRESH_EXPIRATION || '7d').trim(),
  REFRESH_TOKEN_MAX_AGE: parseInt((process.env.REFRESH_TOKEN_MAX_AGE || '604800000').trim(), 10),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
  CLOUDINARY_API_KEY: (process.env.CLOUDINARY_API_KEY || '').trim(),
  CLOUDINARY_API_SECRET: (process.env.CLOUDINARY_API_SECRET || '').trim(),
};

module.exports = env;
