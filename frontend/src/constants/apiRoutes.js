export const API_ROUTES = {
    AUTH: {
        REGISTER: "/user/auth/signup",
        VERIFY_OTP: "/user/auth/verify-otp",
        RESEND_OTP: "/user/auth/resend-otp",
        LOGIN: "/user/auth/login",
        LOGOUT: "/user/auth/logout",
    },
    ADMIN_AUTH: {
        LOGIN: "/admin/auth/login",
    },
    ADMIN_USERS: {
        GET_ALL: "/admin/users",
        BLOCK: (userId) => `/admin/users/${userId}/block`,
        UNBLOCK: (userId) => `/admin/users/${userId}/unblock`,
    },
    ADMIN_PRODUCTS: {
        GET_ALL: "/admin/products",
        CREATE: "/admin/products",
    }
};
