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
    ADMIN_AUTH: {
        LOGIN: "/admin/auth/login",
    },
    ADMIN_USERS: {
        GET_ALL: "/admin/users",
        GET_PARTNERS: "/admin/users/partners",
        CREATE_PARTNER: "/admin/users/partner",
        UPDATE_PARTNER: (userId) => `/admin/users/${userId}`,
        GET_BY_ROLE: (role) => `/admin/users/role/${role}`,
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
