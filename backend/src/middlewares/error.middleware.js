const multer = require('multer');

const globalErrorHandler = (err, req, res, next) => {
    console.error("GLOBAL ERROR CAUGHT:", err);

    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: `Upload Error: ${err.message}`,
        });
    } else if (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message || 'Internal Server Error',
        });
    }
    next();
};

module.exports = {
    globalErrorHandler
};
