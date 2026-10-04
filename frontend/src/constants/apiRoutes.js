export const API_ROUTES = {
    AUTH: {
        REGISTER: "/user/auth/signup",
        VERIFY_OTP: "/user/auth/verify-otp",
        RESEND_OTP: "/user/auth/resend-otp",
        LOGIN: "/user/auth/login",
        GOOGLE: "/user/auth/google",
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
        MOVE_TO_CART: (productId) => `/user/wishlist/${productId}/move-to-cart`,
    },
    CART: {
        GET: "/user/cart",
        COUNT: "/user/cart/count",
        RECOMMENDATIONS: "/user/cart/recommendations",
        ADD_ITEM: "/user/cart/items",
        UPDATE_ITEM: (itemId) => `/user/cart/items/${itemId}`,
        REMOVE_ITEM: (itemId) => `/user/cart/items/${itemId}`,
        MOVE_TO_WISHLIST: (itemId) => `/user/cart/items/${itemId}/move-to-wishlist`,
        CLEAR: "/user/cart",
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
