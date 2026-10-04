import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { logoutUser } from "../../services/Auth/authService";
import { clearAuth } from "../../store/slices/authSlice";
import { clearAccessToken } from "../../store/slices/tokenSlice";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";

/**
 * Logout everywhere (header menu, mobile drawer, profile tab): the API blacklists the refresh token and clears its
 * cookie, then this browser forgets the user (Redux + every cached query) and goes to the landing page.
 * Local state is cleared even when the API call fails, so the user is never stuck logged in.
 */
export const useLogout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { mutate, isPending } = useMutation({
        mutationFn: logoutUser,
        // On the mutation itself (not on mutate), so it runs even if the button's component unmounts meanwhile
        onSettled: () => {
            // User first: ProtectedRoute sends a page without a user to the landing page (not to login)
            dispatch(clearAuth());
            dispatch(clearAccessToken());
            queryClient.clear();
            toast.success("Logged out", { id: "logged-out" });
            navigate(FRONTEND_ROUTES.LANDING, { replace: true });
        },
    });

    // options: e.g. { onSettled: closeDialog }
    const logout = (options) => mutate(undefined, options);

    return { logout, isPending };
};
