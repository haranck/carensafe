import { useMutation } from "@tanstack/react-query";
import {
    registerUser,
    verifyOtp,
    resendOtp,
    loginUser,
    googleLogin,
    adminLogin,
    adminLogout,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
} from "../../services/Auth/authService";

export const useUserSignUp = () => {
    return useMutation({
        mutationFn: registerUser,
    });
};

export const useVerifyOtp = () => {
    return useMutation({
        mutationFn: verifyOtp,
    });
};

export const useResendOtp = () => {
    return useMutation({
        mutationFn: resendOtp,
    });
};

export const useUserLogin = () => {
    return useMutation({
        mutationFn: loginUser,
    });
};

export const useGoogleAuth = () => {
    return useMutation({
        mutationFn: googleLogin,
    });
};

export const useForgotPassword = () => {
    return useMutation({
        mutationFn: forgotPassword,
    });
};

export const useVerifyResetOtp = () => {
    return useMutation({
        mutationFn: verifyResetOtp,
    });
};

export const useResetPassword = () => {
    return useMutation({
        mutationFn: resetPassword,
    });
};

export const useAdminLogin = () => {
    return useMutation({
        mutationFn: adminLogin,
    });
};

export const useAdminLogout = () => {
    return useMutation({
        mutationFn: adminLogout,
    });
};
