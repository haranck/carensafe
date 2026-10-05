const mongoose = require('mongoose');

// Majority reads and writes on the primary: a committed transaction survives a primary failover
const TRANSACTION_OPTIONS = {
    readConcern: { level: 'majority' },
    writeConcern: { w: 'majority' },
    readPreference: 'primary'
};

/**
 * Runs `work(session)` in one MongoDB transaction (Atlas replica set). The driver retries the whole callback on
 * TransientTransactionError and the commit on UnknownTransactionCommitResult, so `work` must be safe to re-run: read
 * everything it needs inside, through the session. Never call external APIs (Razorpay) inside `work`.
 * Every repository call inside must receive the session.
 */
const withTransaction = async (work) => {
    const session = await mongoose.startSession();
    try {
        let result;
        await session.withTransaction(async () => {
            result = await work(session);
        }, TRANSACTION_OPTIONS);
        return result;
    } finally {
        await session.endSession();
    }
};

module.exports = { withTransaction };
