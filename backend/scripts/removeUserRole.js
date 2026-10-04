// One-off migration: removes the old `role`, `areaManagerId` and `distributorId` fields from every user.
// Run from the backend folder: node scripts/removeUserRole.js
const env = require('../src/config/envValidation');
const mongoose = require('mongoose');
const User = require('../src/models/user.model');

async function run() {
    try {
        await mongoose.connect(env.MONGO_URI);
        console.log('MongoDB connected successfully');

        // These fields are no longer in the schema, so Mongoose would strip them from the update.
        // Use the native collection to unset them directly.
        const result = await User.collection.updateMany(
            {
                $or: [
                    { role: { $exists: true } },
                    { areaManagerId: { $exists: true } },
                    { distributorId: { $exists: true } }
                ]
            },
            { $unset: { role: '', areaManagerId: '', distributorId: '' } }
        );

        console.log(`Matched ${result.matchedCount} user(s), updated ${result.modifiedCount}.`);
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

run();
