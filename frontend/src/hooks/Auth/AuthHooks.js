import { useMutation } from "@tanstack/react-query";
import { registerUser, verifyOtp, resendOtp, loginUser, adminLogin } from "../../services/Auth/authService";

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

export const useAdminLogin = () => {
    return useMutation({
        mutationFn: adminLogin,
    });
};
