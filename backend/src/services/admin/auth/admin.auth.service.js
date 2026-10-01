const userRepository = require('../../../repositories/user/auth/auth.repository');
const passwordUtil = require('../../../utils/password');

class AdminAuthService {

    async adminLogin({ email, password }) {
        const normalizedEmail = email.trim().toLowerCase();

        const user = await userRepository.findByEmail(normalizedEmail);
        if (!user || !user.isAdmin) {
            const error = new Error('Invalid admin credentials');
            error.statusCode = 401;
            throw error;
        }

        const isPasswordValid = await passwordUtil.compare(password, user.password);
        if (!isPasswordValid) {
            const error = new Error('Invalid admin credentials');
            error.statusCode = 401;
            throw error;
        }

        return {
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                isAdmin: user.isAdmin,
                role: user.role
            }
        };
    }
}

module.exports = new AdminAuthService();