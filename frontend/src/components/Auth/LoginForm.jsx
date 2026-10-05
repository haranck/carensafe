import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUserLogin } from "../../hooks/Auth/AuthHooks";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useDispatch } from "react-redux";
import { setAccessToken } from "../../store/slices/tokenSlice";
import { setAuthUser } from "../../store/slices/authSlice";
import { FRONTEND_ROUTES, postLoginPath } from "../../constants/frontendRoutes";
import { getErrorMessage } from "../../utils/errorMessage";
import GoogleLoginButton from "./GoogleLoginButton";
import ForgotPasswordModal from "./ForgotPasswordModal";

// ── Zod schema ──────────────────────────────────────────────
const loginSchema = z.object({
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

// ── Inline error ─────────────────────────────────────────────
const FieldError = ({ message }) =>
    message ? (
        <p className="flex items-center gap-1 text-[11.5px] font-semibold text-rose-500 mt-1 pl-1">
            <AlertCircle size={13} />
            {message}
        </p>
    ) : null;

// ── Reusable field ────────────────────────────────────────────
const Field = ({ label, icon: Icon, error, children, rightIcon }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 pl-1">
            {label}
        </label>
        <div
            className={`flex items-center rounded-xl border bg-slate-50/80 transition-all duration-200
        focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(214,0,138,0.12)]
        ${error
                    ? "border-rose-400 focus-within:border-rose-400 focus-within:shadow-[0_0_0_3px_rgba(244,63,94,0.12)]"
                    : "border-slate-200 focus-within:border-[#d6008a]"
                }`}
        >
            <span className={`pl-4 flex-shrink-0 transition-colors duration-200 ${error ? "text-rose-400" : "text-slate-400 group-focus-within:text-[#d6008a]"}`}>
                <Icon size={18} />
            </span>
            {children}
            {rightIcon && (
                <span className="pr-3 flex-shrink-0">
                    {rightIcon}
                </span>
            )}
        </div>
        <FieldError message={error?.message} />
    </div>
);

// ── Component ─────────────────────────────────────────────────
const LoginForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isForgotOpen, setIsForgotOpen] = useState(false);

    const {
        register,
        handleSubmit,
        getValues,
        setValue,
        formState: { errors },
    } = useForm({ resolver: zodResolver(loginSchema), mode: "onTouched" });

    const { mutate, isPending, isError, error } = useUserLogin();
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const onSubmit = (data) => {
        mutate(data, {
            onSuccess: (res) => {
                dispatch(setAccessToken(res.data.accessToken));
                dispatch(setAuthUser(res.data.user));
                // Same target PublicRoute redirects to once the token is set
                navigate(postLoginPath(location.state), { replace: true });
            }
        });
    };

    const inputClass =
        "min-w-0 flex-1 bg-transparent border-none outline-none py-3.5 px-3.5 text-base md:text-[14.5px] text-slate-800 placeholder:text-slate-300 placeholder:text-[13.5px]"; // 16px on phones: iOS doesn't zoom in on focus

    // Phones: no card (border / shadow), just the form with side padding; the card from md
    return (
        <div className="w-full max-w-[460px] px-5 py-2 md:rounded-3xl md:bg-white md:p-10 md:shadow-[0_12px_40px_rgba(59,42,138,0.12),0_2px_8px_rgba(0,0,0,0.05)]">

            {/* Logo (phones have it in the top bar) */}
            <div className="hidden md:flex justify-center mb-6">
                <img src="/logo.webp" alt="Care N Safe" className="h-10 object-contain" />
            </div>

            {/* Heading */}
            <div className="text-center mb-6 md:mb-8">
                <h2 className="text-[26px] font-extrabold text-[#2c265a] tracking-tight mb-1.5">
                    Welcome Back
                </h2>
                <p className="text-[13.5px] text-slate-400">
                    Log in to continue your period-care journey.
                </p>
            </div>

            {/* API banners */}
            {isError && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-[12.5px] font-semibold text-center">
                    {getErrorMessage(error, "Login failed. Please try again.")}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>

                <Field label="Email Address" icon={Mail} error={errors.email}>
                    <input type="email" placeholder="priya@email.com" className={inputClass} {...register("email")} />
                </Field>

                <Field 
                    label="Password" 
                    icon={Lock} 
                    error={errors.password}
                    rightIcon={
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none p-1"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    }
                >
                    <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Enter your password" 
                        className={inputClass} 
                        {...register("password")} 
                    />
                </Field>

                <div className="flex justify-end -mt-3">
                    <button
                        type="button"
                        onClick={() => setIsForgotOpen(true)}
                        className="inline-flex min-h-10 items-center rounded-full px-2 -mr-2 text-[12px] font-semibold text-slate-500 hover:text-[#d6008a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6008a]/30"
                    >
                        Forgot Password?
                    </button>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isPending}
                    className="mt-2 w-full py-4 rounded-xl text-white text-[15px] font-bold tracking-wide
            bg-gradient-to-r from-[#3b2a8a] via-[#7c3aed] to-[#d6008a]
            shadow-[0_4px_16px_rgba(214,0,138,0.30)]
            hover:opacity-90 hover:-translate-y-px hover:shadow-[0_6px_22px_rgba(214,0,138,0.40)]
            active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed
            transition-all duration-200 flex items-center justify-center gap-2"
                >
                    {isPending ? (
                        <span className="w-[20px] h-[20px] border-[2.5px] border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    ) : (
                        "Log In →"
                    )}
                </button>

                {/* OR divider + Google button (hidden when VITE_GOOGLE_CLIENT_ID is missing) */}
                <GoogleLoginButton />

                {/* Signup link */}
                <p className="text-center text-[13px] text-slate-500 pt-3">
                    Don't have an account?{" "}
                    {/* Pass the return path along, so signing up still brings the user back to where they were */}
                    <Link to={FRONTEND_ROUTES.SIGNUP} state={location.state} className="text-[#d6008a] font-bold hover:underline">
                        Sign up
                    </Link>
                </p>
            </form>

            {/* Forgot password (Google sign-in users create a password here); afterwards their email is filled in */}
            <ForgotPasswordModal
                open={isForgotOpen}
                initialEmail={isForgotOpen ? getValues("email") : ""}
                onClose={() => setIsForgotOpen(false)}
                onDone={(email) => {
                    setValue("email", email, { shouldValidate: true });
                    setValue("password", "");
                }}
            />
        </div>
    );
};

export default LoginForm;
