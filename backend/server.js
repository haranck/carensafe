const env = require('./src/config/envValidation');
const mongoose = require('mongoose');
const app = require('./src/app');
const { redisClient } = require('./src/infrastructure/cache/redisClient');
const { startPaymentJobs } = require('./src/jobs/payment.jobs');

const PORT = env.PORT;

let server;

async function startServer() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(env.MONGO_URI);
        console.log('MongoDB connected successfully');

        // Collections and indexes exist before any request, so none is created inside a transaction
        await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).init()));
        console.log(`Razorpay mode: ${env.RAZORPAY_MODE} · refunds to: ${env.REFUND_DESTINATION} · webhook: ${env.RAZORPAY_WEBHOOK_SECRET ? 'on' : 'off'}`);

        console.log('Connecting to Redis...');
        await redisClient.connect();
        console.log('Redis connected successfully');

        startPaymentJobs();

        // Express 5 passes listen errors (e.g. EADDRINUSE) to this callback instead of throwing
        server = app.listen(PORT, (error) => {
            if (error) {
                console.error(`Failed to start CareNSafe server on port ${PORT}:`, error.message);
                process.exit(1);
            }
            console.log(`CareNSafe server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start CareNSafe server:', error.message);
        process.exit(1);
    }
}

startServer();
