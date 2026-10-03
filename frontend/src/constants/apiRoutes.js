export const API_ROUTES = {
    AUTH: {
        REGISTER: "/user/auth/signup",
        VERIFY_OTP: "/user/auth/verify-otp",
        RESEND_OTP: "/user/auth/resend-otp",
        LOGIN: "/user/auth/login",
        LOGOUT: "/user/auth/logout",
    },
    PRODUCTS: {
        LIST: "/user/products",
        FILTERS: "/user/products/filters",
        DETAIL: (id) => `/user/products/${id}`,
        SIMILAR: (id) => `/user/products/${id}/similar`,
    },
    WISHLIST: {
        LIST: "/user/wishlist",
        IDS: "/user/wishlist/ids",
        ADD: "/user/wishlist",
        REMOVE: (productId) => `/user/wishlist/${productId}`,
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
        UPDATE_STATUS: (id) => `/admin/products/${id}/status`,
        UPDATE_VARIANT: (id, variantId) => `/admin/products/${id}/variants/${variantId}`,
    }
};
