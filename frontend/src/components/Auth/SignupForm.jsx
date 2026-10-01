import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUserSignUp } from "../../hooks/Auth/AuthHooks";
import { Link } from "react-router-dom";
import { User, Mail, Phone, Lock, Tag, AlertCircle } from "lucide-react";
import OtpModal from "../Modal/OtpModal";

// ── Zod schema ──────────────────────────────────────────────
const signupSchema = z
    .object({
        fullName: z
            .string()
            .min(2, "Full name must be at least 2 characters")
            .max(60, "Full name is too long")
            .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
        email: z
            .string()
            .min(1, "Email is required")
            .email("Enter a valid email address"),
        phone: z
            .string()
            .min(10, "Phone must be at least 10 digits")
            .max(15, "Phone number is too long")
            .regex(/^[0-9+\-\s()]+$/, "Enter a valid phone number"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Must contain at least one uppercase letter")
            .regex(/[0-9]/, "Must contain at least one number"),
        confirmPassword: z.string().min(1, "Please confirm your password"),
        referralCode: z.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

// ── Inline error ─────────────────────────────────────────────
const FieldError = ({ message }) =>
    message ? (
        <p className="flex items-center gap-1 text-[10.5px] font-semibold text-rose-500 mt-1 pl-0.5">
            <AlertCircle size={11} />
            {message}
        </p>
    ) : null;

// ── Reusable field ────────────────────────────────────────────
const Field = ({ label, icon: Icon, error, children }) => (
    <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
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
            <span className={`pl-3 flex-shrink-0 transition-colors duration-200 ${error ? "text-rose-400" : "text-slate-400 group-focus-within:text-[#d6008a]"}`}>
                <Icon size={14} />
            </span>
            {children}
        </div>
        <FieldError message={error?.message} />
    </div>
);

// ── Component ─────────────────────────────────────────────────
const SignupForm = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ resolver: zodResolver(signupSchema), mode: "onTouched" });

    const { mutate, isPending, isError, error, isSuccess } = useUserSignUp();
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState("");

    const onSubmit = (data) => {
        const [firstName, ...rest] = data.fullName.trim().split(" ");
        mutate({
            firstName,
            lastName: rest.join(" ") || "",
            email: data.email,
            phone: data.phone,
            password: data.password,
        }, {
            onSuccess: () => {
                setRegisteredEmail(data.email);
                setIsOtpModalOpen(true);
            }
        });
    };

    const inputClass =
        "flex-1 bg-transparent border-none outline-none py-2.5 px-3 text-[13px] text-slate-800 placeholder:text-slate-300 placeholder:text-xs";

    return (
        <div className="bg-white rounded-2xl shadow-[0_12px_40px_rgba(59,42,138,0.10),0_2px_8px_rgba(0,0,0,0.05)] p-8 w-full max-w-[420px]">



            {/* Heading */}
            <div className="text-center mb-6">
                <h2 className="text-[22px] font-extrabold text-[#2c265a] tracking-tight mb-1">
                    Create Your Account
                </h2>
                <p className="text-[12px] text-slate-400">
                    Join Care N Safe for a better period-care experience.
                </p>
            </div>

            {/* API banners */}
            {isError && (
                <div className="mb-4 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold text-center">
                    {error?.response?.data?.message || error?.message || "Registration failed. Please try again."}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5" noValidate>

                <Field label="Full Name" icon={User} error={errors.fullName}>
                    <input type="text" placeholder="Priya Sharma" className={inputClass} {...register("fullName")} />
                </Field>

                <Field label="Email Address" icon={Mail} error={errors.email}>
                    <input type="email" placeholder="priya@email.com" className={inputClass} {...register("email")} />
                </Field>

                <Field label="Phone Number" icon={Phone} error={errors.phone}>
                    <input type="tel" placeholder="+91 98765 43210" className={inputClass} {...register("phone")} />
                </Field>

                <Field label="Password" icon={Lock} error={errors.password}>
                    <input type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" className={inputClass} {...register("password")} />
                </Field>

                <Field label="Confirm Password" icon={Lock} error={errors.confirmPassword}>
                    <input type="password" placeholder="Re-enter your password" className={inputClass} {...register("confirmPassword")} />
                </Field>

                <Field label="Referral Code (Optional)" icon={Tag} error={undefined}>
                    <input type="text" placeholder="Enter code if you have one" className={inputClass} {...register("referralCode")} />
                </Field>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isPending}
                    className="mt-1 w-full py-3 rounded-xl text-white text-[13.5px] font-bold tracking-wide
            bg-gradient-to-r from-[#3b2a8a] via-[#7c3aed] to-[#d6008a]
            shadow-[0_4px_16px_rgba(214,0,138,0.30)]
            hover:opacity-90 hover:-translate-y-px hover:shadow-[0_6px_22px_rgba(214,0,138,0.40)]
            active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed
            transition-all duration-200 flex items-center justify-center gap-2"
                >
                    {isPending ? (
                        <span className="w-[18px] h-[18px] border-[2.5px] border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    ) : (
                        "Create Account →"
                    )}
                </button>

                {/* ── OR divider ── */}
                <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-[11px] text-slate-400 font-medium">or continue with</span>
                    <div className="flex-1 h-px bg-slate-100" />
                </div>

                {/* Google signup button */}
                <button
                    type="button"
                    onClick={() => { /* TODO: wire Google OAuth */ }}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13px] font-semibold shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:shadow-md active:scale-[0.99] transition-all duration-200"
                >
                    {/* Google "G" SVG */}
                    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107" />
                        <path d="M6.306 14.691l6.571 4.819C14.655 16.108 19.001 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00" />
                        <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.312 0-9.623-3.337-11.282-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50" />
                        <path d="M43.611 20.083H42V20H24v8h11.303a11.934 11.934 0 01-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2" />
                    </svg>
                    Sign up with Google
                </button>

                {/* Login link */}
                <p className="text-center text-xs text-slate-400 pt-1">
                    Already have an account?{" "}
                    <Link to="/login" className="text-[#d6008a] font-bold hover:underline">
                        Login
                    </Link>
                </p>
            </form>

            {/* OTP Modal */}
            <OtpModal
                isOpen={isOtpModalOpen}
                onClose={() => setIsOtpModalOpen(false)}
                email={registeredEmail}
            />
        </div>
    );
};

export default SignupForm;
