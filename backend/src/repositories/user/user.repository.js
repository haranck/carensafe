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

    findAll(filter = {}) {
        return User.find(filter);
    }

    findByRole(role) {
        return User.find({ role });
    }

    updateById(userId, updateData) {
        return User.findByIdAndUpdate(userId, updateData, { returnDocument: 'after', runValidators: true });
    }

    updateRole(userId, role) {
        return User.findByIdAndUpdate(userId, { role }, { returnDocument: 'after', runValidators: true });
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

    findPromotersByDistributor(distributorId) {
        return User.find({ role: 'PROMOTER', distributorId });
    }

    findPromotersByAreaManager(areaManagerId) {
        return User.find({ role: 'PROMOTER', areaManagerId });
    }

    findDistributorsByAreaManager(areaManagerId) {
        return User.find({ role: 'DISTRIBUTOR', areaManagerId });
    }
}

module.exports = new UserRepository();
