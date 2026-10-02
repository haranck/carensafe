import { AxiosInstance } from "../api/axios";
import { API_ROUTES } from "../constants/apiRoutes";

export const getAllUsers = async () => {
    const response = await AxiosInstance.get(API_ROUTES.ADMIN_USERS.GET_ALL);
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
