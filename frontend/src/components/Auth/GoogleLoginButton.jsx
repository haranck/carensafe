import { useGoogleLogin } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useGoogleAuth } from "../../hooks/Auth/AuthHooks";
import { setAccessToken } from "../../store/slices/tokenSlice";
import { setAuthUser } from "../../store/slices/authSlice";
import { postLoginPath } from "../../constants/frontendRoutes";
import { FOCUS_RING } from "../../constants/customerTheme";
import { getErrorMessage } from "../../utils/errorMessage";

// main.jsx only mounts GoogleOAuthProvider when this is set, and useGoogleLogin needs the provider
const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

const POPUP_FAILED_MESSAGE = "Google sign-in was cancelled or failed";

// Official multicolor Google "G" (lucide has no Google icon)
const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107" />
        <path d="M6.306 14.691l6.571 4.819C14.655 16.108 19.001 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00" />
        <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.312 0-9.623-3.337-11.282-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50" />
        <path d="M43.611 20.083H42V20H24v8h11.303a11.934 11.934 0 01-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2" />
    </svg>
);

const GoogleLoginButtonInner = () => {
    const { mutate, isPending } = useGoogleAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    // Popup returns an authorization code; the backend exchanges and verifies it with Google
    const openGooglePopup = useGoogleLogin({
        flow: "auth-code",
        onSuccess: ({ code }) => {
            mutate(code, {
                onSuccess: (res) => {
                    dispatch(setAccessToken(res.data.accessToken));
                    dispatch(setAuthUser(res.data.user));
                    toast.success(`Welcome, ${res.data.user.firstName}!`);
                    // Same target as LoginForm / PublicRoute (internal paths only, else home)
                    navigate(postLoginPath(location.state), { replace: true });
                },
                onError: (error) => {
                    toast.error(getErrorMessage(error, "Google sign-in failed. Please try again."));
                },
            });
        },
        // OAuth errors (e.g. access denied)
        onError: () => toast.error(POPUP_FAILED_MESSAGE),
        // Popup closed or blocked
        onNonOAuthError: () => toast.error(POPUP_FAILED_MESSAGE),
    });

    return (
        <>
            {/* ── OR divider ── */}
            <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[12px] text-slate-400 font-medium">or continue with</span>
                <div className="flex-1 h-px bg-slate-100" />
            </div>

            <button
                type="button"
                onClick={() => openGooglePopup()}
                disabled={isPending}
                className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-[14px] font-semibold shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:shadow-md active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 ${FOCUS_RING}`}
            >
                {isPending ? <Loader2 size={20} className="animate-spin text-slate-500" /> : <GoogleIcon />}
                Continue with Google
            </button>
        </>
    );
};

// Renders nothing when VITE_GOOGLE_CLIENT_ID is missing (divider included)
const GoogleLoginButton = () => (GOOGLE_ENABLED ? <GoogleLoginButtonInner /> : null);

export default GoogleLoginButton;
