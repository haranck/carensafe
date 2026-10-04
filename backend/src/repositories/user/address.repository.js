const mongoose = require('mongoose');
const Address = require('../../models/address.model');

// Every query is scoped to the user, so another user's address id simply isn't found
class AddressRepository {
    // Runs `work(session)` in a transaction (Atlas replica set); retried by the driver on transient errors
    runInTransaction(work) {
        return mongoose.connection.transaction(work);
    }

    findByUser(userId) {
        return Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1, _id: -1 }).lean();
    }

    findOwn(userId, addressId) {
        return Address.findOne({ _id: addressId, user: userId }).lean();
    }

    countByUser(userId) {
        return Address.countDocuments({ user: userId });
    }

    async create(addressData, session) {
        const [address] = await Address.create([addressData], { session });
        return address.toObject();
    }

    updateOwn(userId, addressId, updateData, session) {
        return Address.findOneAndUpdate(
            { _id: addressId, user: userId },
            updateData,
            { returnDocument: 'after', runValidators: true, session }
        ).lean();
    }

    unsetDefault(userId, session) {
        return Address.updateMany({ user: userId, isDefault: true }, { $set: { isDefault: false } }, { session });
    }

    deleteOwn(userId, addressId, session) {
        return Address.findOneAndDelete({ _id: addressId, user: userId }, { session }).lean();
    }

    findLatestUpdated(userId, session) {
        return Address.findOne({ user: userId }).sort({ updatedAt: -1, _id: -1 }).session(session).lean();
    }
}

module.exports = new AddressRepository();
