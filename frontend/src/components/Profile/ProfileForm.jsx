import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { AlertCircle, Loader2 } from "lucide-react";
import { useUpdateProfile } from "../../hooks/Profile/ProfileHooks";
import { BRAND_GRADIENT, FOCUS_RING } from "../../constants/customerTheme";
import { getErrorMessage } from "../../utils/errorMessage";

// Same rules as middlewares/profile.validation.js (backend); an empty phone removes it
const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50, "First name can be at most 50 characters"),
  lastName: z.string().trim().max(50, "Last name can be at most 50 characters"),
  phone: z
    .string()
    .trim()
    .refine((value) => value === "" || /^[6-9]\d{9}$/.test(value), "Enter a valid 10-digit Indian mobile number"),
});

const INPUT =
  "h-11 w-full rounded-xl border bg-white px-3.5 text-[14px] text-slate-800 placeholder:text-slate-300 outline-none transition-colors focus:border-[#d6008a] focus:shadow-[0_0_0_3px_rgba(214,0,138,0.12)]";

const toFormValues = (profile) => ({
  firstName: profile.firstName || "",
  lastName: profile.lastName || "",
  phone: profile.phone || "",
});

const Field = ({ id, label, hint, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-[12px] font-bold uppercase tracking-wide text-slate-500">
      {label}
    </label>
    {children}
    {error ? (
      <p className="flex items-center gap-1 text-[12px] font-semibold text-rose-500">
        <AlertCircle size={13} aria-hidden="true" />
        {error.message}
      </p>
    ) : (
      hint && <p className="text-[12px] text-slate-400">{hint}</p>
    )}
  </div>
);

// First / last name + phone. Save is enabled once something changed.
const ProfileForm = ({ profile }) => {
  const formId = useId();
  const { mutate, isPending, isError, error } = useUpdateProfile();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(profileSchema), mode: "onTouched", defaultValues: toFormValues(profile) });

  const onSubmit = (data) =>
    mutate(data, {
      onSuccess: (response) => {
        // Saved values become the new baseline, so Save disables again
        reset(toFormValues(response.data));
        toast.success("Profile updated", { id: "profile-updated" });
      },
    });

  const inputClass = (fieldError) => `${INPUT} ${fieldError ? "border-rose-400" : "border-slate-200"}`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {isError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] font-semibold text-rose-600">
          {getErrorMessage(error, "Couldn't save your profile. Please try again.")}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${formId}-first`} label="First name" error={errors.firstName}>
          <input id={`${formId}-first`} autoComplete="given-name" className={inputClass(errors.firstName)} {...register("firstName")} />
        </Field>
        <Field id={`${formId}-last`} label="Last name" error={errors.lastName}>
          <input id={`${formId}-last`} autoComplete="family-name" className={inputClass(errors.lastName)} {...register("lastName")} />
        </Field>
      </div>
      <Field id={`${formId}-phone`} label="Phone number" hint="10-digit Indian mobile number" error={errors.phone}>
        <input
          id={`${formId}-phone`}
          type="tel"
          inputMode="numeric"
          maxLength={10}
          autoComplete="tel-national"
          placeholder="9876543210"
          className={inputClass(errors.phone)}
          {...register("phone")}
        />
      </Field>
      <div>
        <button
          type="submit"
          disabled={!isDirty || isPending}
          className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-8 text-[14.5px] font-bold text-white sm:w-auto ${BRAND_GRADIENT} shadow-[0_6px_18px_rgba(124,58,237,0.28)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none transition-all ${FOCUS_RING}`}
        >
          {isPending && <Loader2 size={17} aria-hidden="true" className="animate-spin" />}
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;
