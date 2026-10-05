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

// Each size is saved separately: { productId, variantId } → { itemId, productId, variantId }
export const addToWishlist = async ({ productId, variantId }) => {
    const response = await AxiosInstance.post(API_ROUTES.WISHLIST.ADD, { productId, variantId });
    return response.data;
};

// { itemId }: adds one of that saved variant to the cart, then removes only that wishlist item
export const moveWishlistItemToCart = async ({ itemId }) => {
    const response = await AxiosInstance.post(API_ROUTES.WISHLIST.MOVE_TO_CART(itemId));
    return response.data;
};

// { itemId }: one saved size
export const removeFromWishlist = async ({ itemId }) => {
    const response = await AxiosInstance.delete(API_ROUTES.WISHLIST.REMOVE(itemId));
    return response.data;
};
