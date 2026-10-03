import { useCallback } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";

const LOGIN_REQUIRED_TOAST_ID = "login-required";
const DEFAULT_MESSAGE = "Please log in to continue";

// One toast id, so repeated clicks or redirects never stack copies
export const showLoginRequired = (message = DEFAULT_MESSAGE) => toast.error(message, { id: LOGIN_REQUIRED_TOAST_ID });

/**
 * Central gate for actions that need an account (wishlist heart, Add to Cart, Buy Now, Write a Review…).
 * Buttons stay visible and clickable for guests; the gate decides:
 *
 *   const requireAuth = useRequireAuth();
 *   const handleAdd = () => {
 *     if (!requireAuth("Log in to add items to your cart")) return;
 *     ...
 *   };
 *
 * Logged in → true. Guest → toast + login page → false. After logging in, LoginForm brings them back to this
 * exact URL (pathname + search, so shop filters and the selected variant are kept).
 */
export const useRequireAuth = () => {
    const isLoggedIn = useSelector((s) => Boolean(s.token.accessToken));
    const navigate = useNavigate();
    const location = useLocation();

    return useCallback(
        (message) => {
            if (isLoggedIn) return true;
            showLoginRequired(message);
            navigate(FRONTEND_ROUTES.LOGIN, { state: { from: location } });
            return false;
        },
        [isLoggedIn, navigate, location]
    );
};
