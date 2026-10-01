const env = require('./src/config/envValidation');
const mongoose = require('mongoose');
const app = require('./src/app');
const { redisClient } = require('./src/infrastructure/cache/redisClient');

const PORT = env.PORT;

let server;

async function startServer() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(env.MONGO_URI);
        console.log('MongoDB connected successfully');

        console.log('Connecting to Redis...');
        await redisClient.connect();
        console.log('Redis connected successfully');

        server = app.listen(PORT, () => {
            console.log(`CareNSafe server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start CareNSafe server:', error.message);
        process.exit(1);
    }
}

startServer();
