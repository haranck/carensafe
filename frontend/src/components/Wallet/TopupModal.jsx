import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Info, Loader2, ShieldCheck } from "lucide-react";
import Modal from "../common/Modal";
import { BRAND_GRADIENT, FOCUS_RING } from "../../constants/customerTheme";

const QUICK_AMOUNTS = [200, 500, 1000];

// Same rules as middlewares/wallet.validation.js (whole rupees between the configured limits)
const topupSchema = (min, max) =>
  z.object({
    amount: z
      .number({ error: "Enter an amount" })
      .int("Enter a whole number of rupees")
      .min(min, `Add at least ₹${min}`)
      .max(max, `You can add up to ₹${max} at a time`),
  });

const TopupForm = ({ min, max, testMode, isPending, onSubmit }) => {
  const formId = useId();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(topupSchema(min, max)), mode: "onTouched", defaultValues: { amount: 500 } });

  return (
    <form onSubmit={handleSubmit(({ amount }) => onSubmit(amount))} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${formId}-amount`} className="text-[12px] font-bold uppercase tracking-wide text-slate-500">
          Amount (₹)
        </label>
        <input
          id={`${formId}-amount`}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          className={`h-12 w-full rounded-xl border bg-white px-3.5 text-[18px] font-bold text-slate-800 outline-none focus:border-[#d6008a] focus:shadow-[0_0_0_3px_rgba(214,0,138,0.12)] ${errors.amount ? "border-rose-400" : "border-slate-200"}`}
          {...register("amount", { valueAsNumber: true })}
        />
        {errors.amount ? (
          <p className="flex items-center gap-1 text-[12px] font-semibold text-rose-500">
            <AlertCircle size={13} aria-hidden="true" />
            {errors.amount.message}
          </p>
        ) : (
          <p className="text-[12px] text-slate-500">
            Between ₹{min} and ₹{max.toLocaleString("en-IN")}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Quick amounts">
        {QUICK_AMOUNTS.filter((value) => value >= min && value <= max).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setValue("amount", value, { shouldValidate: true })}
            className={`inline-flex h-10 items-center rounded-full border border-pink-200 bg-white px-4 text-[13px] font-bold text-[#d6008a] hover:bg-[#fff5fa] ${FOCUS_RING}`}
          >
            ₹{value.toLocaleString("en-IN")}
          </button>
        ))}
      </div>

      {testMode && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-800">
          <Info size={14} aria-hidden="true" className="mt-0.5 flex-shrink-0" />
          Test mode — use UPI ID success@razorpay. No real money is charged.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-bold text-white ${BRAND_GRADIENT} disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`}
      >
        {isPending && <Loader2 size={18} aria-hidden="true" className="animate-spin" />}
        Continue to pay
      </button>
      <p className="flex items-center justify-center gap-1.5 text-[12px] text-slate-500">
        <ShieldCheck size={13} aria-hidden="true" className="text-emerald-600" />
        Secured by Razorpay · UPI, cards, net banking
      </p>
    </form>
  );
};

/** Amount for a wallet top-up; `onSubmit(rupees)` starts the Razorpay payment (the page owns the payment flow). */
const TopupModal = ({ open, onClose, min = 100, max = 10000, testMode, isPending, onSubmit }) => (
  <Modal open={open} title="Add money to wallet" description="Money is added as soon as the payment is confirmed." onClose={isPending ? () => {} : onClose}>
    <TopupForm min={min} max={max} testMode={testMode} isPending={isPending} onSubmit={onSubmit} />
  </Modal>
);

export default TopupModal;
