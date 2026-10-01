const User = require('../../../models/user.model');

class AuthRepository {
    async findByEmail(email) {
        return await User.findOne({ email: email.toLowerCase() });
    }

    async create(userData) {
        const user = new User(userData);
        return await user.save();
    }
}

module.exports = new AuthRepository();
