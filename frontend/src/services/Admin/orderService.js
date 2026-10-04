import { AxiosInstance } from "../../api/axios";
import { API_ROUTES } from "../../constants/apiRoutes";

// filters: { page, limit, search, orderStatus, paymentStatus, from, to, hasReturnRequest }
export const getAdminOrders = async (filters) => {
    const response = await AxiosInstance.get(API_ROUTES.ADMIN_ORDERS.GET_ALL, { params: filters });
    return response.data;
};

export const getAdminOrderStats = async () => {
    const response = await AxiosInstance.get(API_ROUTES.ADMIN_ORDERS.STATS);
    return response.data;
};

export const getAdminReturnItems = async ({ page = 1, limit = 10 } = {}) => {
    const response = await AxiosInstance.get(API_ROUTES.ADMIN_ORDERS.RETURNS, { params: { page, limit } });
    return response.data;
};

export const getAdminOrder = async (id) => {
    const response = await AxiosInstance.get(API_ROUTES.ADMIN_ORDERS.DETAIL(id));
    return response.data;
};

// { id, status, note, courier?, trackingNumber?, trackingUrl?, expectedDelivery? }
export const updateAdminOrderStatus = async ({ id, ...data }) => {
    const response = await AxiosInstance.patch(API_ROUTES.ADMIN_ORDERS.UPDATE_STATUS(id), data);
    return response.data;
};

// { id, reason, note }
export const cancelAdminOrder = async ({ id, reason, note }) => {
    const response = await AxiosInstance.post(API_ROUTES.ADMIN_ORDERS.CANCEL(id), { reason, note });
    return response.data;
};

// { id, itemId, decision: "approved" | "rejected", adminReason? }
export const decideReturn = async ({ id, itemId, decision, adminReason }) => {
    const response = await AxiosInstance.patch(API_ROUTES.ADMIN_ORDERS.DECIDE_RETURN(id, itemId), { decision, adminReason });
    return response.data;
};

// { id, itemId }
export const markReturnReceived = async ({ id, itemId }) => {
    const response = await AxiosInstance.patch(API_ROUTES.ADMIN_ORDERS.RETURN_RECEIVED(id, itemId));
    return response.data;
};
