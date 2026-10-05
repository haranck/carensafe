import { AxiosInstance } from "../../api/axios";
import { API_ROUTES } from "../../constants/apiRoutes";

export const getProducts = async (params = {}) => {
    const response = await AxiosInstance.get(API_ROUTES.PRODUCTS.LIST, { params });
    return response.data;
};

export const getProductFilters = async () => {
    const response = await AxiosInstance.get(API_ROUTES.PRODUCTS.FILTERS);
    return response.data;
};

export const getProductById = async (id) => {
    const response = await AxiosInstance.get(API_ROUTES.PRODUCTS.DETAIL(id));
    return response.data;
};

export const getSimilarProducts = async (id, limit) => {
    const response = await AxiosInstance.get(API_ROUTES.PRODUCTS.SIMILAR(id), { params: { limit } });
    return response.data;
};
