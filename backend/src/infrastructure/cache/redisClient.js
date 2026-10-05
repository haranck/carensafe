const Redis = require('ioredis');
const env = require('../../config/envValidation');

const options = {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  enableReadyCheck: true,
  retryStrategy(times) {
    return Math.min(times * 100, 1000);
  }
};

// Prefer REDIS_URL (redis://username:password@host:port); fall back to host/port for local dev
const redisClient = env.REDIS_URL
  ? new Redis(env.REDIS_URL, options)
  : new Redis({ host: env.REDIS_HOST, port: env.REDIS_PORT, ...options });

redisClient.on('error', (err) => {
  console.error('[Redis Error]', err.message);
});

module.exports = { redisClient };