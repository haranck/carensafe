import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { AlertCircle, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import Modal from "../common/Modal";
import OtpInput from "./OtpInput";
import { useForgotPassword, useResetPassword, useVerifyResetOtp } from "../../hooks/Auth/AuthHooks";
import { BRAND_GRADIENT, FOCUS_RING } from "../../constants/customerTheme";
import { getErrorMessage } from "../../utils/errorMessage";

// Same as the API: a new code every 30 seconds, codes are 6 digits
const RESEND_SECONDS = 30;
const OTP_LENGTH = 6;

const emailSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
});

// Same rules as the backend Joi password rule (signup and reset)
const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[!@#$%^&*]/, "Must contain at least one special character (!@#$%^&*)"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const TITLES = {
  email: { title: "Forgot Password", description: "Google sign-in user? This creates a password for your account." },
  otp: { title: "Verify Your Email", description: "Enter the 6-digit code we emailed you." },
  password: { title: "Set a New Password", description: "Choose a strong password you don't use elsewhere." },
};

const INPUT =
  "h-11 w-full rounded-xl border bg-white px-3.5 text-[14px] text-slate-800 placeholder:text-slate-300 outline-none transition-colors focus:border-[#d6008a] focus:shadow-[0_0_0_3px_rgba(214,0,138,0.12)]";
const SUBMIT = `inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-bold text-white ${BRAND_GRADIENT} shadow-[0_6px_18px_rgba(124,58,237,0.28)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 transition-all ${FOCUS_RING}`;
const LINK_BUTTON = `inline-flex min-h-10 items-center rounded-full px-2 text-[13px] font-bold text-[#d6008a] hover:text-[#9d0063] disabled:cursor-not-allowed disabled:text-slate-400 ${FOCUS_RING}`;

const FieldError = ({ message }) =>
  message ? (
    <p className="flex items-center gap-1 text-[12px] font-semibold text-rose-500">
      <AlertCircle size={13} aria-hidden="true" />
      {message}
    </p>
  ) : null;

const ApiError = ({ error, fallback }) =>
  error ? (
    <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] font-semibold text-rose-600">
      {getErrorMessage(error, fallback)}
    </p>
  ) : null;

const PasswordField = ({ id, label, error, registration, autoComplete }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          className={`${INPUT} pr-12 ${error ? "border-rose-400" : "border-slate-200"}`}
          {...registration}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className={`absolute right-1 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 ${FOCUS_RING}`}
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
      <FieldError message={error?.message} />
    </div>
  );
};

// email → code → new password. Mounted fresh each time the modal opens.
const ForgotPasswordFlow = ({ initialEmail, step, onStepChange, onDone }) => {
  const id = useId();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);

  const requestCode = useForgotPassword();
  const verifyCode = useVerifyResetOtp();
  const savePassword = useResetPassword();

  const emailForm = useForm({ resolver: zodResolver(emailSchema), mode: "onTouched", defaultValues: { email: initialEmail || "" } });
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema), mode: "onTouched", defaultValues: { password: "", confirmPassword: "" } });

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const sendCode = (address) =>
    requestCode.mutate(address, {
      onSuccess: () => {
        setEmail(address);
        setOtp("");
        setOtpError("");
        setSecondsLeft(RESEND_SECONDS);
        verifyCode.reset();
        onStepChange("otp");
      },
    });

  const handleVerify = (e) => {
    e.preventDefault();
    if (otp.length !== OTP_LENGTH) {
      setOtpError("Enter the 6-digit code");
      return;
    }
    setOtpError("");
    verifyCode.mutate(
      { email, otp },
      {
        onSuccess: (response) => {
          setResetToken(response.data.resetToken);
          onStepChange("password");
        },
        onError: () => setOtp(""),
      }
    );
  };

  const handleSave = ({ password }) =>
    savePassword.mutate(
      { resetToken, password },
      {
        onSuccess: (response) => {
          toast.success("Password updated. Log in with your new password.", { id: "password-reset" });
          onDone(response.data.email);
        },
      }
    );

  if (step === "email") {
    return (
      <form onSubmit={emailForm.handleSubmit(({ email: address }) => sendCode(address.toLowerCase()))} noValidate className="flex flex-col gap-4">
        <ApiError error={requestCode.error} fallback="Couldn't send the code. Please try again." />
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-email`} className="text-[12px] font-bold uppercase tracking-wide text-slate-500">
            Email address
          </label>
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            placeholder="priya@email.com"
            className={`${INPUT} ${emailForm.formState.errors.email ? "border-rose-400" : "border-slate-200"}`}
            {...emailForm.register("email")}
          />
          <FieldError message={emailForm.formState.errors.email?.message} />
        </div>
        <button type="submit" disabled={requestCode.isPending} className={SUBMIT}>
          {requestCode.isPending && <Loader2 size={18} aria-hidden="true" className="animate-spin" />}
          Send Code
        </button>
      </form>
    );
  }

  if (step === "otp") {
    return (
      <form onSubmit={handleVerify} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff5fa] text-[#d6008a]">
            <MailCheck size={24} aria-hidden="true" />
          </span>
          <p className="text-[13px] text-slate-500">
            If an account exists for <span className="font-semibold text-[#1e1a3a]">{email}</span>, a code is on its way. It expires
            in 5 minutes.
          </p>
        </div>
        <ApiError error={verifyCode.error || requestCode.error} fallback="Couldn't verify the code. Please try again." />
        <div className="flex flex-col items-center gap-1.5">
          <OtpInput value={otp} onChange={setOtp} disabled={verifyCode.isPending} hasError={Boolean(otpError)} />
          <FieldError message={otpError} />
        </div>
        <button type="submit" disabled={verifyCode.isPending || otp.length !== OTP_LENGTH} className={SUBMIT}>
          {verifyCode.isPending && <Loader2 size={18} aria-hidden="true" className="animate-spin" />}
          Verify Code
        </button>
        <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-slate-500">
          <button type="button" onClick={() => onStepChange("email")} className={LINK_BUTTON}>
            Change email
          </button>
          {secondsLeft > 0 ? (
            <span aria-live="polite">Resend code in 0:{String(secondsLeft).padStart(2, "0")}</span>
          ) : (
            <button type="button" onClick={() => sendCode(email)} disabled={requestCode.isPending} className={LINK_BUTTON}>
              {requestCode.isPending ? "Sending…" : "Resend code"}
            </button>
          )}
        </div>
      </form>
    );
  }

  const { errors } = passwordForm.formState;
  return (
    <form onSubmit={passwordForm.handleSubmit(handleSave)} noValidate className="flex flex-col gap-4">
      <ApiError error={savePassword.error} fallback="Couldn't save your password. Please try again." />
      <PasswordField
        id={`${id}-password`}
        label="New password"
        autoComplete="new-password"
        error={errors.password}
        registration={passwordForm.register("password")}
      />
      <PasswordField
        id={`${id}-confirm`}
        label="Confirm password"
        autoComplete="new-password"
        error={errors.confirmPassword}
        registration={passwordForm.register("confirmPassword")}
      />
      <p className="text-[12px] text-slate-400">At least 8 characters with an uppercase and lowercase letter, a number and a special character.</p>
      {savePassword.isError && (
        <button type="button" onClick={() => onStepChange("email")} className={`${LINK_BUTTON} self-start`}>
          Start again
        </button>
      )}
      <button type="submit" disabled={savePassword.isPending} className={SUBMIT}>
        {savePassword.isPending && <Loader2 size={18} aria-hidden="true" className="animate-spin" />}
        Save Password
      </button>
    </form>
  );
};

/**
 * Forgot password (also how Google sign-in users create a password). `initialEmail` prefills step 1;
 * `onDone(email)` runs after the password is saved (the login form fills the email in).
 */
const ForgotPasswordModal = ({ open, initialEmail, onClose, onDone }) => {
  const [step, setStep] = useState("email");

  // Every opening starts at step 1 (state adjusted during render, so the closing animation keeps its step)
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setStep("email");
  }

  const { title, description } = TITLES[step];

  return (
    <Modal open={open} title={title} description={description} onClose={onClose}>
      <ForgotPasswordFlow
        initialEmail={initialEmail}
        step={step}
        onStepChange={setStep}
        onDone={(email) => {
          onDone(email);
          onClose();
        }}
      />
    </Modal>
  );
};

export default ForgotPasswordModal;
