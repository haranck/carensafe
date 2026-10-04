import { useId } from "react";
import { useSelector } from "react-redux";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { useSendContactMessage } from "../../hooks/Contact/ContactHooks";
import { CONTACT_TOPICS } from "../../constants/company";
import { BRAND_GRADIENT, FOCUS_RING } from "../../constants/customerTheme";
import { getErrorMessage } from "../../utils/errorMessage";

const MESSAGE_MAX = 2000;

// Same rules as middlewares/contact.validation.js (backend)
const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60, "Name can be at most 60 characters"),
  email: z.string().trim().min(1, "Please enter your email").email("Please enter a valid email address"),
  phone: z.union([z.literal(""), z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")]),
  topic: z.enum(
    CONTACT_TOPICS.map((topic) => topic.value),
    { error: "Please choose a topic" }
  ),
  orderNumber: z.union([z.literal(""), z.string().trim().regex(/^CNS-\d{8}-\d{4}$/i, "Order numbers look like CNS-20261004-4821")]),
  message: z.string().trim().min(10, "Please write at least 10 characters").max(MESSAGE_MAX, `Your message can be at most ${MESSAGE_MAX} characters`),
  website: z.string(), // honeypot
});

const INPUT =
  "w-full rounded-xl border bg-white px-3.5 text-[14px] text-slate-800 placeholder:text-slate-300 outline-none transition-colors focus:border-[#d6008a] focus:shadow-[0_0_0_3px_rgba(214,0,138,0.12)]";
const inputClass = (error) => `${INPUT} ${error ? "border-rose-400" : "border-slate-200"}`;

const Field = ({ id, label, optional, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-[12px] font-bold uppercase tracking-wide text-slate-500">
      {label}
      {optional && <span className="ml-1 font-medium normal-case tracking-normal text-slate-400">(optional)</span>}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-[12px] font-semibold text-rose-500">
        <AlertCircle size={13} aria-hidden="true" />
        {error.message}
      </p>
    )}
  </div>
);

const SuccessPanel = ({ onAgain }) => (
  <div role="status" className="flex flex-col items-center gap-3 py-10 text-center">
    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
      <CheckCircle2 size={32} aria-hidden="true" />
    </span>
    <p className="text-[20px] font-extrabold text-[#1e1a3a]">Message sent!</p>
    <p className="max-w-[360px] text-[14px] leading-relaxed text-slate-500">
      Thanks for writing to us. We&apos;ve emailed you a confirmation and will reply within 1 working day.
    </p>
    <button
      type="button"
      onClick={onAgain}
      className={`mt-2 inline-flex h-10 items-center rounded-full border border-pink-200 px-5 text-[13.5px] font-bold text-[#d6008a] hover:bg-[#fff5fa] ${FOCUS_RING}`}
    >
      Send another message
    </button>
  </div>
);

/** Contact form: sends to the team inbox (POST /user/contact). Logged-in customers get their name and email filled in. */
const ContactForm = () => {
  const formId = useId();
  const id = (name) => `${formId}-${name}`;
  const user = useSelector((state) => state.auth.user);
  const send = useSendContactMessage();

  const defaults = {
    name: [user?.firstName, user?.lastName].filter(Boolean).join(" "),
    email: user?.email || "",
    phone: "",
    topic: undefined,
    orderNumber: "",
    message: "",
    website: "",
  };
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(contactSchema), mode: "onTouched", defaultValues: defaults });
  const message = useWatch({ control, name: "message" }) || "";
  const topic = useWatch({ control, name: "topic" });

  if (send.isSuccess) {
    return (
      <SuccessPanel
        onAgain={() => {
          reset({ ...defaults, name: defaults.name, email: defaults.email });
          send.reset();
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit((data) => send.mutate(data))} noValidate className="flex flex-col gap-4">
      {send.isError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] font-semibold text-rose-600">
          {getErrorMessage(send.error, "Couldn't send your message. Please try again or call us.")}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={id("name")} label="Your name" error={errors.name}>
          <input id={id("name")} autoComplete="name" className={`${inputClass(errors.name)} h-11`} {...register("name")} />
        </Field>
        <Field id={id("email")} label="Email" error={errors.email}>
          <input id={id("email")} type="email" autoComplete="email" className={`${inputClass(errors.email)} h-11`} {...register("email")} />
        </Field>
        <Field id={id("phone")} label="Phone" optional error={errors.phone}>
          <input
            id={id("phone")}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            autoComplete="tel-national"
            placeholder="9876543210"
            className={`${inputClass(errors.phone)} h-11`}
            {...register("phone")}
          />
        </Field>
        <Field id={id("topic")} label="Topic" error={errors.topic}>
          <select id={id("topic")} className={`${inputClass(errors.topic)} h-11`} {...register("topic")}>
            <option value="">Choose a topic</option>
            {CONTACT_TOPICS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {topic === "order" && (
        <Field id={id("orderNumber")} label="Order number" optional error={errors.orderNumber}>
          <input id={id("orderNumber")} placeholder="CNS-20261004-4821" className={`${inputClass(errors.orderNumber)} h-11 uppercase`} {...register("orderNumber")} />
        </Field>
      )}

      <Field id={id("message")} label="Message" error={errors.message}>
        <textarea
          id={id("message")}
          rows={5}
          maxLength={MESSAGE_MAX}
          placeholder="How can we help?"
          className={`${inputClass(errors.message)} resize-y py-3`}
          {...register("message")}
        />
        <p className="self-end text-[11.5px] text-slate-400" aria-live="off">
          {message.length}/{MESSAGE_MAX}
        </p>
      </Field>

      {/* Honeypot: hidden from people and screen readers; bots fill it */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={id("website")}>Website</label>
        <input id={id("website")} tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <button
        type="submit"
        disabled={send.isPending}
        className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-bold text-white ${BRAND_GRADIENT} shadow-[0_6px_18px_rgba(124,58,237,0.28)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 transition-all sm:w-auto sm:self-start sm:px-8 ${FOCUS_RING}`}
      >
        {send.isPending ? <Loader2 size={18} aria-hidden="true" className="animate-spin" /> : <Send size={17} aria-hidden="true" />}
        Send message
      </button>
    </form>
  );
};

export default ContactForm;
