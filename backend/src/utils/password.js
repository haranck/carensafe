const bcrypt = require('bcrypt');

class PasswordUtil {
    async hash(password) {
        const saltRounds = 10;
        return bcrypt.hash(password, saltRounds);
    }

    async compare(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = new PasswordUtil();
