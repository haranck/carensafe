import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, AlertCircle, Eye, EyeOff, Shield } from "lucide-react";
import { useAdminLogin } from "../../../hooks/Auth/AuthHooks";

// ── Zod schema ──────────────────────────────────────────────
const loginSchema = z.object({
    email: z.string().min(1, "Email is required").email("Enter a valid admin email address"),
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
const AdminLoginForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ resolver: zodResolver(loginSchema), mode: "onTouched" });

    const { mutate, isPending, isError, error } = useAdminLogin();
    const navigate = useNavigate();

    const onSubmit = (data) => {
        mutate(data, {
            onSuccess: () => {
                // Admin login successful: skip JWT/Redux and go straight to dashboard
                navigate("/admin/dashboard");
            }
        });
    };

    const inputClass =
        "flex-1 bg-transparent border-none outline-none py-3.5 px-3.5 text-[14.5px] text-slate-800 placeholder:text-slate-300 placeholder:text-[13.5px]";

    return (
        <div className="bg-white rounded-3xl shadow-[0_12px_40px_rgba(59,42,138,0.12),0_2px_8px_rgba(0,0,0,0.05)] p-10 w-full max-w-[460px]">

            {/* Logo and Admin Badge */}
            <div className="flex flex-col items-center justify-center mb-6">
                <img src="/logo.webp" alt="Care N Safe" className="h-10 object-contain mb-3" />
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-slate-600">
                    <Shield size={14} className="text-slate-500" />
                    <span className="text-xs font-bold uppercase tracking-widest">Admin Portal</span>
                </div>
            </div>

            <div className="text-center mb-8">
                <h2 className="text-[26px] font-black text-[#1e1a3a] tracking-tight mb-2">
                    Admin Access
                </h2>
                <p className="text-[13.5px] text-slate-500 font-medium">
                    Secure login for authorized personnel only
                </p>
            </div>

            {isError && (
                <div className="mb-6 p-3 rounded-xl bg-rose-50 text-rose-600 text-[13px] font-semibold text-center border border-rose-100 flex items-center justify-center gap-2">
                    <AlertCircle size={16} />
                    {error?.response?.data?.message || "Invalid email or password."}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                {/* Email */}
                <Field label="Email Address" icon={Mail} error={errors.email}>
                    <input 
                        type="email" 
                        placeholder="admin@caren-safe.com" 
                        className={inputClass} 
                        {...register("email")} 
                    />
                </Field>

                {/* Password */}
                <Field 
                    label="Password" 
                    icon={Lock} 
                    error={errors.password}
                    rightIcon={
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none p-1 border-none bg-transparent cursor-pointer"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    }
                >
                    <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Enter your admin password" 
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
                    className="mt-2 w-full py-4 rounded-xl text-white text-[15px] font-bold tracking-wide border-none cursor-pointer
            bg-slate-800 hover:bg-slate-900
            shadow-[0_4px_16px_rgba(30,26,58,0.20)]
            hover:-translate-y-px hover:shadow-[0_6px_22px_rgba(30,26,58,0.30)]
            active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed
            transition-all duration-200 flex items-center justify-center gap-2"
                >
                    {isPending ? (
                        <span className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    ) : (
                        <>
                            Secure Login <Lock size={16} />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default AdminLoginForm;
