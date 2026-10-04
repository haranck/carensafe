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

export const googleLogin = async (code) => {
    const response = await AxiosInstance.post(
        API_ROUTES.AUTH.GOOGLE,
        { code }
    );
    return response.data;
};

// Forgot password: email → code (same answer whether or not the account exists)
export const forgotPassword = async (email) => {
    const response = await AxiosInstance.post(API_ROUTES.AUTH.FORGOT_PASSWORD, { email });
    return response.data;
};

// { email, otp } → { resetToken } (one-time, 10 minutes)
export const verifyResetOtp = async (data) => {
    const response = await AxiosInstance.post(API_ROUTES.AUTH.VERIFY_RESET_OTP, data);
    return response.data;
};

// { resetToken, password }
export const resetPassword = async (data) => {
    const response = await AxiosInstance.post(API_ROUTES.AUTH.RESET_PASSWORD, data);
    return response.data;
};

// Blacklists the refresh token and clears its cookie
export const logoutUser = async () => {
    const response = await AxiosInstance.post(API_ROUTES.AUTH.LOGOUT);
    return response.data;
};

export const adminLogin = async (data) => {
    const response = await AxiosInstance.post(
        API_ROUTES.ADMIN_AUTH.LOGIN,
        data
    );
    return response.data;
};
