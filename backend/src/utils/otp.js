const crypto = require('crypto');

class OtpUtil {
    generateOtp(length = 6) {
        const min = Math.pow(10, length - 1);
        const max = Math.pow(10, length) - 1;
        return crypto.randomInt(min, max).toString();
    }
}

module.exports = new OtpUtil();
