import { AxiosInstance } from "../../api/axios";
import { API_ROUTES } from "../../constants/apiRoutes";

// { items, summary }: lines built from live product data + totals computed on the server
export const getCart = async () => {
    const response = await AxiosInstance.get(API_ROUTES.CART.GET);
    return response.data;
};

export const getCartCount = async () => {
    const response = await AxiosInstance.get(API_ROUTES.CART.COUNT);
    return response.data;
};

export const getCartRecommendations = async () => {
    const response = await AxiosInstance.get(API_ROUTES.CART.RECOMMENDATIONS);
    return response.data;
};

// quantity is optional (1)
export const addCartItem = async ({ productId, variantId, quantity }) => {
    const response = await AxiosInstance.post(API_ROUTES.CART.ADD_ITEM, { productId, variantId, quantity });
    return response.data;
};

// Update / remove / clear / move answer with the whole updated cart
export const updateCartItem = async ({ itemId, quantity }) => {
    const response = await AxiosInstance.patch(API_ROUTES.CART.UPDATE_ITEM(itemId), { quantity });
    return response.data;
};

export const removeCartItem = async (itemId) => {
    const response = await AxiosInstance.delete(API_ROUTES.CART.REMOVE_ITEM(itemId));
    return response.data;
};

export const moveCartItemToWishlist = async (itemId) => {
    const response = await AxiosInstance.post(API_ROUTES.CART.MOVE_TO_WISHLIST(itemId));
    return response.data;
};

export const clearCart = async () => {
    const response = await AxiosInstance.delete(API_ROUTES.CART.CLEAR);
    return response.data;
};
