const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('./config/envValidation');
const { globalRateLimiter } = require('./middlewares/rateLimit.middleware');
const { globalErrorHandler } = require('./middlewares/error.middleware');

const app = express();

const corsOptions = {
    origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Apply global rate limiting to all /api routes
// app.use('/api', globalRateLimiter);

const authRoutes = require('./routes/user/auth/auth.routes');
const productsRoutes = require('./routes/user/products/products.routes');
const wishlistRoutes = require('./routes/user/wishlist/wishlist.routes');
const cartRoutes = require('./routes/user/cart/cart.routes');
const profileRoutes = require('./routes/user/user/user.routes');
const addressRoutes = require('./routes/user/address/address.routes');
const orderRoutes = require('./routes/user/order/order.routes');
const walletRoutes = require('./routes/user/wallet/wallet.routes');
const adminAuthRoutes = require('./routes/admin/admin.auth.routes');
const adminUserRoutes = require('./routes/admin/admin.user.routes');
const adminProductRoutes = require('./routes/admin/admin.product.routes');
const adminOrderRoutes = require('./routes/admin/admin.order.routes');

app.use('/api/user/auth', authRoutes);
app.use('/api/user/products', productsRoutes);
app.use('/api/user/wishlist', wishlistRoutes);
app.use('/api/user/cart', cartRoutes);
app.use('/api/user/profile', profileRoutes);
app.use('/api/user/addresses', addressRoutes);
app.use('/api/user/orders', orderRoutes);
app.use('/api/user/wallet', walletRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/orders', adminOrderRoutes);

app.use(globalErrorHandler);

module.exports = app;
