const User = require('../../models/user.model');

class UserRepository {
    create(userData) {
        return User.create(userData);
    }

    findById(userId) {
        return User.findById(userId);
    }

    findByEmail(email) {
        return User.findOne({ email: email.toLowerCase() });
    }

    // Only what authMiddleware needs on every request
    findStatusById(userId) {
        return User.findById(userId).select('isBlocked').lean();
    }

    findByGoogleId(googleId) {
        return User.findOne({ googleId });
    }

    async findAll(filter = {}, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            User.countDocuments(filter)
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    updateById(userId, updateData) {
        return User.findByIdAndUpdate(userId, updateData, { returnDocument: 'after', runValidators: true });
    }

    updateBlockStatus(userId, isBlocked) {
        return User.findByIdAndUpdate(userId, { isBlocked }, { returnDocument: 'after', runValidators: true });
    }

    deleteById(userId) {
        return User.findByIdAndDelete(userId);
    }

    existsByEmail(email) {
        return User.exists({ email: email.toLowerCase() });
    }
}

module.exports = new UserRepository();
