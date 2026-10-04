import { AxiosInstance } from "../../api/axios";
import { API_ROUTES } from "../../constants/apiRoutes";

// Default first, then newest
export const getAddresses = async () => {
    const response = await AxiosInstance.get(API_ROUTES.ADDRESSES.LIST);
    return response.data;
};

export const createAddress = async (data) => {
    const response = await AxiosInstance.post(API_ROUTES.ADDRESSES.CREATE, data);
    return response.data;
};

export const updateAddress = async ({ id, data }) => {
    const response = await AxiosInstance.patch(API_ROUTES.ADDRESSES.UPDATE(id), data);
    return response.data;
};

// Delete and set-default answer with the whole updated list
export const deleteAddress = async (id) => {
    const response = await AxiosInstance.delete(API_ROUTES.ADDRESSES.DELETE(id));
    return response.data;
};

export const setDefaultAddress = async (id) => {
    const response = await AxiosInstance.patch(API_ROUTES.ADDRESSES.SET_DEFAULT(id));
    return response.data;
};
