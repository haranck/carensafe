import { AxiosInstance } from "../../api/axios";
import { API_ROUTES } from "../../constants/apiRoutes";

export const getProfile = async () => {
    const response = await AxiosInstance.get(API_ROUTES.PROFILE.GET);
    return response.data;
};

// { firstName?, lastName?, phone? } (empty phone removes it)
export const updateProfile = async (data) => {
    const response = await AxiosInstance.patch(API_ROUTES.PROFILE.UPDATE, data);
    return response.data;
};

export const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const response = await AxiosInstance.patch(API_ROUTES.PROFILE.AVATAR, formData);
    return response.data;
};

export const requestEmailChange = async (newEmail) => {
    const response = await AxiosInstance.post(API_ROUTES.PROFILE.EMAIL_REQUEST_OTP, { newEmail });
    return response.data;
};

export const verifyEmailChange = async (otp) => {
    const response = await AxiosInstance.post(API_ROUTES.PROFILE.EMAIL_VERIFY, { otp });
    return response.data;
};
