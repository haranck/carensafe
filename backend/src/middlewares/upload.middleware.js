const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'carensafe/products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], // camelCase is preferred for multer-storage-cloudinary
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per image
    }
});

module.exports = upload;
