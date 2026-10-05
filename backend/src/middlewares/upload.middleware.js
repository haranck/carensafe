const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
const LIMITS = {
    fileSize: 5 * 1024 * 1024, // 5MB limit per image
};

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'carensafe/products',
        allowed_formats: ALLOWED_FORMATS, // camelCase is preferred for multer-storage-cloudinary
    },
});

const upload = multer({
    storage: storage,
    limits: LIMITS
});

// Profile photos: own folder, cropped to a 400×400 square around the face
const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'carensafe/avatars',
        allowed_formats: ALLOWED_FORMATS,
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    },
});

const avatarUpload = multer({
    storage: avatarStorage,
    limits: LIMITS
});

module.exports = upload;
module.exports.avatarUpload = avatarUpload;
