const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('./config/envValidation');
const { globalRateLimiter } = require('./middlewares/rateLimit.middleware');

const app = express();

const corsOptions = {
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Apply global rate limiting to all /api routes
app.use('/api', globalRateLimiter);

const authRoutes = require('./routes/user/auth/auth.routes');
const adminAuthRoutes = require('./routes/admin/admin.auth.routes');

app.use('/api/user/auth', authRoutes);
app.use('/api/admin/auth', adminAuthRoutes);

module.exports = app;
