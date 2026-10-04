import { useId } from "react";
import { Banknote, CreditCard } from "lucide-react";
import StepCard from "./StepCard";
import { PAYMENT_METHODS } from "../../utils/checkout";

const ICONS = { cod: Banknote, online: CreditCard };

/**
 * Step 2: payment method. Cash on Delivery places a real order; "Pay Online" stays disabled until Razorpay
 * (it will plug into the same order: paymentMethod "razorpay").
 */
const PaymentStep = ({ method, onChange }) => {
  const headingId = useId();
  const radioName = useId();

  return (
    <StepCard number={2} title="Payment Method" headingId={headingId}>
      <fieldset>
        <legend className="sr-only">Payment method</legend>
        <div className="flex flex-col gap-3">
          {PAYMENT_METHODS.map(({ id, label, hint, isAvailable }) => {
            const Icon = ICONS[id];
            const checked = method === id;
            return (
              <label
                key={id}
                className={`flex min-h-14 items-center gap-3 rounded-2xl border p-3.5 transition-colors sm:p-4 ${
                  !isAvailable
                    ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-70"
                    : checked
                      ? "cursor-pointer border-[#d6008a] bg-[#fff5fa]"
                      : "cursor-pointer border-slate-200 bg-white hover:border-pink-200"
                }`}
              >
                <input
                  type="radio"
                  name={radioName}
                  value={id}
                  checked={checked}
                  disabled={!isAvailable}
                  onChange={() => onChange(id)}
                  className="h-4 w-4 flex-shrink-0 accent-[#d6008a]"
                />
                <span
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${checked ? "bg-white text-[#d6008a]" : "bg-slate-100 text-slate-500"}`}
                >
                  <Icon size={19} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 text-[14.5px] font-bold text-[#1e1a3a]">
                    {label}
                    {!isAvailable && (
                      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-bold text-[#3b2a8a]">Coming soon</span>
                    )}
                  </span>
                  <span className="block text-[12.5px] text-slate-500">{hint}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </StepCard>
  );
};

export default PaymentStep;
