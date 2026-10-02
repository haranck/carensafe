const userRepository = require('../../../repositories/user/user.repository');

class AdminUserService {
    async getAllUsers(page, limit, search) {
        const filter = { isAdmin: { $ne: true } };
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        return await userRepository.findAll(filter, page, limit);
    }

    async blockUser(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            const err = new Error('User not found');
            err.statusCode = 404;
            throw err;
        }
        if (user.isAdmin) {
            const err = new Error('Cannot block an admin user');
            err.statusCode = 403;
            throw err;
        }
        if (user.isBlocked) {
            const err = new Error('User is already blocked');
            err.statusCode = 400;
            throw err;
        }
        
        return await userRepository.updateBlockStatus(userId, true);
    }

    async unblockUser(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            const err = new Error('User not found');
            err.statusCode = 404;
            throw err;
        }
        if (!user.isBlocked) {
            const err = new Error('User is not blocked');
            err.statusCode = 400;
            throw err;
        }
        
        return await userRepository.updateBlockStatus(userId, false);
    }
}

module.exports = new AdminUserService();
