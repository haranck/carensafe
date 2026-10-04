import { AxiosInstance } from "../../api/axios";
import { API_ROUTES } from "../../constants/apiRoutes";

// { addressId, paymentMethod: "cod" | "razorpay" | "wallet", useWallet, idempotencyKey }
// → { orderId, orderNumber, paymentRequired, order, razorpay: checkout details | null }
export const placeOrder = async (data) => {
    const response = await AxiosInstance.post(API_ROUTES.ORDERS.PLACE, data);
    return response.data;
};

// { page, limit, status } (status: active | delivered | cancelled | returns, or "" for all)
export const getMyOrders = async ({ page = 1, limit = 10, status = "" } = {}) => {
    const response = await AxiosInstance.get(API_ROUTES.ORDERS.LIST, { params: { page, limit, status } });
    return response.data;
};

export const getMyOrder = async (id) => {
    const response = await AxiosInstance.get(API_ROUTES.ORDERS.DETAIL(id));
    return response.data;
};

// { orderId, itemId?, reason, note }: whole order without itemId
export const cancelOrder = async ({ orderId, itemId, reason, note }) => {
    const url = itemId ? API_ROUTES.ORDERS.CANCEL_ITEM(orderId, itemId) : API_ROUTES.ORDERS.CANCEL(orderId);
    const response = await AxiosInstance.post(url, { reason, note });
    return response.data;
};

// { orderId, itemId?, note, packUnopenedConfirmed }: whole order without itemId
export const requestReturn = async ({ orderId, itemId, note, packUnopenedConfirmed }) => {
    const url = itemId ? API_ROUTES.ORDERS.RETURN_ITEM(orderId, itemId) : API_ROUTES.ORDERS.RETURN(orderId);
    const response = await AxiosInstance.post(url, { note, packUnopenedConfirmed });
    return response.data;
};

// Unpaid online order: the same Razorpay checkout again (while the payment window is open)
export const retryOrderPayment = async (id) => {
    const response = await AxiosInstance.post(API_ROUTES.ORDERS.RETRY_PAYMENT(id));
    return response.data;
};
