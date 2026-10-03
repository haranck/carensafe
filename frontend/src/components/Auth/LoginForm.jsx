import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUserLogin } from "../../hooks/Auth/AuthHooks";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useDispatch } from "react-redux";
import { setAccessToken } from "../../store/slices/tokenSlice";
import { setAuthUser } from "../../store/slices/authSlice";

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
    
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ resolver: zodResolver(loginSchema), mode: "onTouched" });

    const { mutate, isPending, isError, error } = useUserLogin();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const onSubmit = (data) => {
        mutate(data, {
            onSuccess: (res) => {
                dispatch(setAccessToken(res.data.accessToken));
                dispatch(setAuthUser(res.data.user));
                navigate("/home");
            }
        });
    };

    const inputClass =
        "flex-1 bg-transparent border-none outline-none py-3.5 px-3.5 text-[14.5px] text-slate-800 placeholder:text-slate-300 placeholder:text-[13.5px]";

    return (
        <div className="bg-white rounded-3xl shadow-[0_12px_40px_rgba(59,42,138,0.12),0_2px_8px_rgba(0,0,0,0.05)] p-10 w-full max-w-[460px]">

            {/* Logo */}
            <div className="flex justify-center mb-6">
                <img src="/logo.webp" alt="Care N Safe" className="h-10 object-contain" />
            </div>

            {/* Heading */}
            <div className="text-center mb-8">
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
                    {error?.response?.data?.message || error?.message || "Login failed. Please try again."}
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
                    <Link to="/forgot-password" className="text-[12px] font-semibold text-slate-500 hover:text-[#d6008a] transition-colors">
                        Forgot Password?
                    </Link>
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

                {/* ── OR divider ── */}
                <div className="flex items-center gap-3 my-2.5">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-[12px] text-slate-400 font-medium">or continue with</span>
                    <div className="flex-1 h-px bg-slate-100" />
                </div>

                {/* Google login button */}
                <button
                    type="button"
                    onClick={() => { /* TODO: wire Google OAuth */ }}
                    className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-[14.5px] font-semibold shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:shadow-md active:scale-[0.99] transition-all duration-200"
                >
                    {/* Google "G" SVG */}
                    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107" />
                        <path d="M6.306 14.691l6.571 4.819C14.655 16.108 19.001 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00" />
                        <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.312 0-9.623-3.337-11.282-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50" />
                        <path d="M43.611 20.083H42V20H24v8h11.303a11.934 11.934 0 01-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2" />
                    </svg>
                    Log in with Google
                </button>

                {/* Signup link */}
                <p className="text-center text-[13px] text-slate-500 pt-3">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-[#d6008a] font-bold hover:underline">
                        Sign up
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default LoginForm;
