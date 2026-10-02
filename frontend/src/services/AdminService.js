import { AxiosInstance } from "../api/axios";
import { API_ROUTES } from "../constants/apiRoutes";

export const getAllUsers = async (page = 1, limit = 10, search = '') => {
    const response = await AxiosInstance.get(API_ROUTES.ADMIN_USERS.GET_ALL, {
        params: { page, limit, search }
    });
    return response.data;
};

export const blockUser = async (userId) => {
    const response = await AxiosInstance.patch(API_ROUTES.ADMIN_USERS.BLOCK(userId));
    return response.data;
};

export const unblockUser = async (userId) => {
    const response = await AxiosInstance.patch(API_ROUTES.ADMIN_USERS.UNBLOCK(userId));
    return response.data;
};

// --- Products ---

export const getAllProducts = async (page = 1, limit = 10, search = '') => {
    const response = await AxiosInstance.get(API_ROUTES.ADMIN_PRODUCTS.GET_ALL, {
        params: { page, limit, search }
    });
    return response.data;
};

export const createProduct = async (formData) => {
    const response = await AxiosInstance.post(API_ROUTES.ADMIN_PRODUCTS.CREATE, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};
