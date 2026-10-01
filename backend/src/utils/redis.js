const { redisClient } = require('../infrastructure/cache/redisClient');

class RedisUtil {
    async setEx(key, expirationInSeconds, value) {
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        await redisClient.set(key, stringValue, 'EX', expirationInSeconds);
    }

    async get(key) {
        const data = await redisClient.get(key);
        if (!data) return null;
        try {
            return JSON.parse(data);
        } catch (e) {
            return data;
        }
    }

    async delete(key) {
        await redisClient.del(key);
    }
}

module.exports = new RedisUtil();
