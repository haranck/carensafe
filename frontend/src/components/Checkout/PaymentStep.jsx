import { useId } from "react";
import { Banknote, CreditCard, Info, ShieldCheck, Wallet } from "lucide-react";
import StepCard from "./StepCard";
import { PAYMENT_METHODS } from "../../utils/checkout";
import { formatPaise } from "../../utils/wallet";

const ICONS = { razorpay: CreditCard, wallet: Wallet, cod: Banknote };

/**
 * Step 2: payment method. Pay Online (Razorpay popup; optionally the wallet balance first), Care N Safe Wallet (only
 * when the balance covers the total) or Cash on Delivery. `testMode` shows Razorpay's test UPI ids.
 */
const PaymentStep = ({ method, onChange, useWallet, onUseWalletChange, balancePaise = 0, totalPaise, testMode = false }) => {
  const headingId = useId();
  const radioName = useId();
  const walletCheckboxId = useId();
  const canPayWithWallet = balancePaise >= totalPaise && totalPaise > 0;

  return (
    <StepCard number={2} title="Payment Method" headingId={headingId}>
      {testMode && (
        <p className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-amber-800">
          <Info size={15} aria-hidden="true" className="mt-0.5 flex-shrink-0" />
          <span>
            Test mode — use UPI ID <span className="font-mono">success@razorpay</span> or <span className="font-mono">failure@razorpay</span>. No real
            money is charged.
          </span>
        </p>
      )}

      <fieldset>
        <legend className="sr-only">Payment method</legend>
        <div className="flex flex-col gap-3">
          {PAYMENT_METHODS.map(({ id, label, hint }) => {
            const Icon = ICONS[id];
            const checked = method === id;
            const disabled = id === "wallet" && !canPayWithWallet;
            return (
              <div
                key={id}
                className={`rounded-2xl border transition-colors ${
                  disabled ? "border-slate-200 bg-slate-50 opacity-70" : checked ? "border-[#d6008a] bg-[#fff5fa]" : "border-slate-200 bg-white hover:border-pink-200"
                }`}
              >
                <label className={`flex min-h-14 items-center gap-3 p-3.5 sm:p-4 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
                  <input
                    type="radio"
                    name={radioName}
                    value={id}
                    checked={checked}
                    disabled={disabled}
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
                      {id === "razorpay" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                          <ShieldCheck size={12} aria-hidden="true" /> Secured by Razorpay
                        </span>
                      )}
                    </span>
                    <span className="block text-[12.5px] text-slate-500">
                      {id === "wallet" ? `Balance ${formatPaise(balancePaise)}${disabled ? " · Insufficient balance" : ""}` : hint}
                    </span>
                  </span>
                </label>

                {checked && id === "razorpay" && balancePaise > 0 && (
                  <div className="border-t border-pink-100 px-3.5 pb-3.5 pt-3 sm:px-4">
                    <label htmlFor={walletCheckboxId} className="flex min-h-10 cursor-pointer items-center gap-2.5 text-[13.5px] font-semibold text-[#1e1a3a]">
                      <input
                        id={walletCheckboxId}
                        type="checkbox"
                        checked={useWallet}
                        onChange={(event) => onUseWalletChange(event.target.checked)}
                        className="h-4 w-4 accent-[#d6008a]"
                      />
                      Use wallet balance ({formatPaise(Math.min(balancePaise, totalPaise))})
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>
    </StepCard>
  );
};

export default PaymentStep;
