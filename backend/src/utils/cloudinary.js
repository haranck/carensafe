const cloudinary = require('../config/cloudinary');

class CloudinaryUtil {
    // Best effort: a failed delete only leaves an orphan image, it never fails the request
    async deleteImage(publicId) {
        if (!publicId) return;
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            console.error('[Cloudinary] Failed to delete image:', publicId, error.message);
        }
    }
}

module.exports = new CloudinaryUtil();
