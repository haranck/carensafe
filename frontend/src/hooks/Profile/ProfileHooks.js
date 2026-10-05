import { useDispatch, useSelector } from "react-redux";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getProfile,
    requestEmailChange,
    updateProfile,
    uploadAvatar,
    verifyEmailChange,
} from "../../services/Profile/profileService";
import { setAuthUser } from "../../store/slices/authSlice";

// Keys carry the user id (like cart / wishlist), so another account on this browser never sees cached data
const profileKey = (userId) => ["profile", userId];

const useSession = () => {
    const isLoggedIn = useSelector((s) => Boolean(s.token.accessToken));
    const userId = useSelector((s) => s.auth.user?.id);
    return { isLoggedIn, userId };
};

// Every profile change answers with the full profile: cache it and refresh the Redux user (header name / avatar)
const useApplyProfile = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { userId } = useSession();
    return (response) => {
        queryClient.setQueryData(profileKey(userId), response);
        dispatch(setAuthUser(response.data));
    };
};

// { id, firstName, lastName, email, phone, avatarUrl, authProvider, canChangeEmail, isAdmin, createdAt }
export const useGetProfile = () => {
    const { isLoggedIn, userId } = useSession();
    return useQuery({ queryKey: profileKey(userId), queryFn: getProfile, enabled: isLoggedIn });
};

export const useUpdateProfile = () => {
    const applyProfile = useApplyProfile();
    return useMutation({ mutationFn: updateProfile, onSuccess: applyProfile });
};

// file → new avatarUrl
export const useUploadAvatar = () => {
    const applyProfile = useApplyProfile();
    return useMutation({ mutationFn: uploadAvatar, onSuccess: applyProfile });
};

// newEmail → code sent to the new address
export const useRequestEmailChange = () => useMutation({ mutationFn: requestEmailChange });

// otp → email updated
export const useVerifyEmailChange = () => {
    const applyProfile = useApplyProfile();
    return useMutation({ mutationFn: verifyEmailChange, onSuccess: applyProfile });
};
