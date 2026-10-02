const userRepository = require('../../../repositories/user/user.repository');
const passwordUtil = require('../../../utils/password');

class AdminUserService {
    async getAllUsers(page, limit, search) {
        const filter = { isAdmin: { $ne: true }, role: 'USER' };
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        return await userRepository.findAll(filter, page, limit);
    }

    async getPartners(page, limit, search) {
        const filter = { role: { $in: ['AREA_MANAGER', 'DISTRIBUTOR', 'PROMOTER'] } };
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

    async createPartner(partnerData) {
        const { firstName, lastName, email, phone, password, role, areaManagerId, distributorId, avatarUrl } = partnerData;

        if (!['AREA_MANAGER', 'DISTRIBUTOR', 'PROMOTER'].includes(role)) {
            const err = new Error('Invalid partner role');
            err.statusCode = 400;
            throw err;
        }

        if (role === 'DISTRIBUTOR' && !areaManagerId) {
            const err = new Error('Area Manager must be selected for Distributor');
            err.statusCode = 400;
            throw err;
        }

        if (role === 'PROMOTER' && (!areaManagerId || !distributorId)) {
            const err = new Error('Area Manager and Distributor must be selected for Promoter');
            err.statusCode = 400;
            throw err;
        }

        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
            const err = new Error('User with this email already exists');
            err.statusCode = 400;
            throw err;
        }

        const hashedPassword = password ? await passwordUtil.hash(password) : undefined;

        const newUserData = {
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword,
            role,
            avatarUrl,
            areaManagerId: (role === 'DISTRIBUTOR' || role === 'PROMOTER') ? areaManagerId : null,
            distributorId: role === 'PROMOTER' ? distributorId : null,
        };

        return await userRepository.create(newUserData);
    }

    async getUsersByRole(role) {
        return await userRepository.findByRole(role);
    }

    async updatePartner(userId, partnerData) {
        const { firstName, lastName, email, phone, password, role, areaManagerId, distributorId, avatarUrl } = partnerData;

        if (!['AREA_MANAGER', 'DISTRIBUTOR', 'PROMOTER'].includes(role)) {
            const err = new Error('Invalid partner role');
            err.statusCode = 400;
            throw err;
        }

        if (role === 'DISTRIBUTOR' && !areaManagerId) {
            const err = new Error('Area Manager must be selected for Distributor');
            err.statusCode = 400;
            throw err;
        }

        if (role === 'PROMOTER' && (!areaManagerId || !distributorId)) {
            const err = new Error('Area Manager and Distributor must be selected for Promoter');
            err.statusCode = 400;
            throw err;
        }

        const existingUser = await userRepository.findByEmail(email);
        if (existingUser && existingUser._id.toString() !== userId) {
            const err = new Error('User with this email already exists');
            err.statusCode = 400;
            throw err;
        }

        const updateData = {
            firstName,
            lastName,
            email,
            phone,
            role,
            areaManagerId: (role === 'DISTRIBUTOR' || role === 'PROMOTER') ? areaManagerId : null,
            distributorId: role === 'PROMOTER' ? distributorId : null,
        };

        if (password) {
            updateData.password = await passwordUtil.hash(password);
        }

        if (avatarUrl) {
            updateData.avatarUrl = avatarUrl;
        }

        return await userRepository.updateById(userId, updateData);
    }
}

module.exports = new AdminUserService();
