import { AxiosInstance } from "../../api/axios";
import { API_ROUTES } from "../../constants/apiRoutes";

export const getWishlist = async (page, limit) => {
    const response = await AxiosInstance.get(API_ROUTES.WISHLIST.LIST, { params: { page, limit } });
    return response.data;
};

export const getWishlistIds = async () => {
    const response = await AxiosInstance.get(API_ROUTES.WISHLIST.IDS);
    return response.data;
};

// variantId is optional: the variant the user was looking at
export const addToWishlist = async ({ productId, variantId }) => {
    const response = await AxiosInstance.post(API_ROUTES.WISHLIST.ADD, { productId, variantId });
    return response.data;
};

export const removeFromWishlist = async (productId) => {
    const response = await AxiosInstance.delete(API_ROUTES.WISHLIST.REMOVE(productId));
    return response.data;
};
