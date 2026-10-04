import { AxiosInstance } from "../../api/axios";
import { API_ROUTES } from "../../constants/apiRoutes";

// Razorpay checkout success handler response: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
export const verifyPayment = async (response) => {
    const result = await AxiosInstance.post(API_ROUTES.PAYMENTS.VERIFY, response);
    return result.data;
};

// Razorpay popup payment.failed: { razorpay_order_id, error }
export const reportPaymentFailure = async (data) => {
    const result = await AxiosInstance.post(API_ROUTES.PAYMENTS.FAILED, data);
    return result.data;
};
