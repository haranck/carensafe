const Redis = require('ioredis');
const env = require('../../config/envValidation');

const redisClient = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
  lazyConnect: true,
  enableReadyCheck: true,
  retryStrategy(times) {
    return Math.min(times * 100, 1000);
  }
});

redisClient.on('error', (err) => {
  console.error('[Redis Error]', err.message);
});

module.exports = { redisClient };