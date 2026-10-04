import { AxiosInstance } from "../../api/axios";
import { API_ROUTES } from "../../constants/apiRoutes";

// { balance (paise), currency }
export const getWallet = async () => {
    const response = await AxiosInstance.get(API_ROUTES.WALLET.GET);
    return response.data;
};

// { page, limit, type: "credit" | "debit" | "" }
export const getWalletTransactions = async ({ page = 1, limit = 10, type = "" } = {}) => {
    const response = await AxiosInstance.get(API_ROUTES.WALLET.TRANSACTIONS, { params: { page, limit, type } });
    return response.data;
};

// amount in rupees → { paymentId, razorpay: checkout details }; the wallet is credited after verification
export const startWalletTopup = async (amount) => {
    const response = await AxiosInstance.post(API_ROUTES.WALLET.TOPUP, { amount });
    return response.data;
};
