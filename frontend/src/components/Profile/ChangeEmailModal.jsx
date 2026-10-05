import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { AlertCircle, Loader2 } from "lucide-react";
import Modal from "../common/Modal";
import { useRequestEmailChange, useVerifyEmailChange } from "../../hooks/Profile/ProfileHooks";
import { BRAND_GRADIENT, FOCUS_RING } from "../../constants/customerTheme";
import { getErrorMessage } from "../../utils/errorMessage";

// Same as the API: a new code can be requested every 30 seconds
const RESEND_SECONDS = 30;

// Same rules as the API (profile.validation.js emailChangeSchema)
const emailSchema = z.object({
  newEmail: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Enter your current password.").max(128, "Incorrect password."),
});

const otpSchema = z.object({
  otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

const INPUT =
  "h-11 w-full rounded-xl border bg-white px-3.5 text-[14px] text-slate-800 placeholder:text-slate-300 outline-none transition-colors focus:border-[#d6008a] focus:shadow-[0_0_0_3px_rgba(214,0,138,0.12)]";
const SUBMIT = `inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-[14.5px] font-bold text-white ${BRAND_GRADIENT} hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 transition-all ${FOCUS_RING}`;
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

// Step 1: new email + current password → code sent to it. Step 2: 6-digit code (resend after 30 s) → email updated.
const EmailChangeFlow = ({ currentEmail, onDone }) => {
  const id = useId();
  const [pendingEmail, setPendingEmail] = useState("");
  // Kept for "Resend code" (the API asks for it on every send)
  const [password, setPassword] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const request = useRequestEmailChange();
  const verify = useVerifyEmailChange();

  const emailForm = useForm({ resolver: zodResolver(emailSchema), mode: "onTouched", defaultValues: { newEmail: "", password: "" } });
  const otpForm = useForm({ resolver: zodResolver(otpSchema), mode: "onTouched", defaultValues: { otp: "" } });

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const sendCode = (newEmail, currentPassword) =>
    request.mutate({ newEmail, password: currentPassword }, {
      onSuccess: (response) => {
        setPendingEmail(response.data.newEmail);
        setPassword(currentPassword);
        setSecondsLeft(RESEND_SECONDS);
        otpForm.reset({ otp: "" });
        verify.reset();
      },
    });

  const onVerify = ({ otp }) =>
    verify.mutate(otp, {
      onSuccess: (response) => {
        toast.success(`Email changed to ${response.data.email}`, { id: "email-changed" });
        onDone();
      },
    });

  if (!pendingEmail) {
    return (
      <form onSubmit={emailForm.handleSubmit(({ newEmail, password: currentPassword }) => sendCode(newEmail, currentPassword))} noValidate className="flex flex-col gap-4">
        <p className="text-[13px] text-slate-500">
          Current email: <span className="font-semibold text-[#1e1a3a]">{currentEmail}</span>
        </p>
        <ApiError error={request.error} fallback="Couldn't send the code. Please try again." />
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-email`} className="text-[12px] font-bold uppercase tracking-wide text-slate-500">
            New email address
          </label>
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            className={`${INPUT} ${emailForm.formState.errors.newEmail ? "border-rose-400" : "border-slate-200"}`}
            {...emailForm.register("newEmail")}
          />
          <FieldError message={emailForm.formState.errors.newEmail?.message} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-password`} className="text-[12px] font-bold uppercase tracking-wide text-slate-500">
            Current password
          </label>
          <input
            id={`${id}-password`}
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            className={`${INPUT} ${emailForm.formState.errors.password ? "border-rose-400" : "border-slate-200"}`}
            {...emailForm.register("password")}
          />
          <FieldError message={emailForm.formState.errors.password?.message} />
        </div>
        <button type="submit" disabled={request.isPending} className={SUBMIT}>
          {request.isPending && <Loader2 size={17} aria-hidden="true" className="animate-spin" />}
          Send OTP
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={otpForm.handleSubmit(onVerify)} noValidate className="flex flex-col gap-4">
      <p className="text-[13px] text-slate-500">
        We sent a 6-digit code to <span className="font-semibold text-[#1e1a3a]">{pendingEmail}</span>. It expires in 5 minutes.
      </p>
      <ApiError error={verify.error || request.error} fallback="Couldn't verify the code. Please try again." />
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-otp`} className="text-[12px] font-bold uppercase tracking-wide text-slate-500">
          Verification code
        </label>
        <input
          id={`${id}-otp`}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="••••••"
          className={`${INPUT} text-center text-[20px] font-bold tracking-[0.5em] ${otpForm.formState.errors.otp ? "border-rose-400" : "border-slate-200"}`}
          {...otpForm.register("otp")}
        />
        <FieldError message={otpForm.formState.errors.otp?.message} />
      </div>
      <button type="submit" disabled={verify.isPending} className={SUBMIT}>
        {verify.isPending && <Loader2 size={17} aria-hidden="true" className="animate-spin" />}
        Verify & Update Email
      </button>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-slate-500">
        <button
          type="button"
          onClick={() => {
            setPendingEmail("");
            setPassword("");
          }}
          className={LINK_BUTTON}
        >
          Use a different email
        </button>
        {secondsLeft > 0 ? (
          <span aria-live="polite">Resend code in 0:{String(secondsLeft).padStart(2, "0")}</span>
        ) : (
          <button type="button" onClick={() => sendCode(pendingEmail, password)} disabled={request.isPending} className={LINK_BUTTON}>
            Resend code
          </button>
        )}
      </div>
    </form>
  );
};

const ChangeEmailModal = ({ open, currentEmail, onClose }) => (
  <Modal open={open} title="Change Email" description="Your email is also your login." onClose={onClose}>
    <EmailChangeFlow currentEmail={currentEmail} onDone={onClose} />
  </Modal>
);

export default ChangeEmailModal;
