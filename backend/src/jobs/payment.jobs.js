const paymentService = require('../services/user/payment/payment.service');
const redisUtil = require('../utils/redis');

const INTERVAL_MS = 60 * 1000;
const FIRST_RUN_MS = 10 * 1000;
// Held a little shorter than the interval: one instance runs each minute, and a crashed run frees it in time
const LOCK_KEY = 'lock:payment-maintenance';
const LOCK_MS = 55 * 1000;

let timer = null;
let running = false;

// Expire unpaid orders / top-ups (after asking Razorpay) and send queued refunds
const tick = async () => {
    if (running) return;
    running = true;
    try {
        if (await redisUtil.acquireLock(LOCK_KEY, LOCK_MS)) await paymentService.runMaintenance();
    } catch (error) {
        console.error('[Payment jobs]', error.message);
    } finally {
        running = false;
    }
};

const startPaymentJobs = () => {
    if (timer) return;
    timer = setInterval(tick, INTERVAL_MS);
    timer.unref();
    setTimeout(tick, FIRST_RUN_MS).unref();
};

module.exports = { startPaymentJobs };
