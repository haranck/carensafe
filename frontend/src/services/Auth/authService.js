import { AxiosInstance } from "../../api/axios";
import { API_ROUTES } from "../../constants/apiRoutes";

export const registerUser = async (data) => {
    const response = await AxiosInstance.post(
        API_ROUTES.AUTH.REGISTER,
        data
    );
    return response.data;
};

export const verifyOtp = async (data) => {
    const response = await AxiosInstance.post(
        API_ROUTES.AUTH.VERIFY_OTP,
        data
    );
    return response.data;
};

export const resendOtp = async (data) => {
    const response = await AxiosInstance.post(
        API_ROUTES.AUTH.RESEND_OTP,
        data
    );
    return response.data;
};

export const loginUser = async (data) => {
    const response = await AxiosInstance.post(
        API_ROUTES.AUTH.LOGIN,
        data
    );
    return response.data;
};

export const adminLogin = async (data) => {
    const response = await AxiosInstance.post(
        API_ROUTES.ADMIN_AUTH.LOGIN,
        data
    );
    return response.data;
};
