import { useId } from "react";
import { useWatch } from "react-hook-form";
import { AlertCircle, Banknote, CreditCard, Info, Landmark, Smartphone } from "lucide-react";
import StepCard from "./StepCard";
import { BANKS, PAYMENT_METHODS, UPI_APPS, formatCardNumber, formatCvv, formatExpiry } from "../../utils/checkout";

const ICONS = { upi: Smartphone, card: CreditCard, netbanking: Landmark, cod: Banknote };

const INPUT =
  "h-11 w-full rounded-xl border bg-white px-3.5 text-[14px] text-slate-800 placeholder:text-slate-300 outline-none transition-colors focus:border-[#d6008a] focus:shadow-[0_0_0_3px_rgba(214,0,138,0.12)]";
const inputClass = (error) => `${INPUT} ${error ? "border-rose-400" : "border-slate-200"}`;

const Field = ({ id, label, error, children }) => (
  <div className="flex min-w-0 flex-col gap-1.5">
    <label htmlFor={id} className="text-[12px] font-bold uppercase tracking-wide text-slate-500">
      {label}
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

// register() for a field whose text is reformatted while typing (card number, expiry, CVV)
const formatted = (registration, format) => ({
  ...registration,
  onChange: (event) => {
    event.target.value = format(event.target.value);
    return registration.onChange(event);
  },
});

/**
 * Step 2: payment method (DEMO). `form` is the page's react-hook-form instance (paymentSchema), so the summary's
 * Place Order button can check it. Card details live only in that form's memory: never sent, logged or stored.
 */
const PaymentStep = ({ form }) => {
  const headingId = useId();
  const fieldId = useId();
  const id = (name) => `${fieldId}-${name}`;
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const method = useWatch({ control, name: "method" });

  return (
    <StepCard number={2} title="Payment Method" headingId={headingId}>
      <p className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] font-semibold text-amber-800">
        <Info size={16} aria-hidden="true" className="mt-0.5 flex-shrink-0" />
        Demo mode — no payment will be charged.
      </p>

      <fieldset>
        <legend className="sr-only">Payment method</legend>
        <div className="flex flex-col gap-3">
          {PAYMENT_METHODS.map(({ id: methodId, label, hint }) => {
            const Icon = ICONS[methodId];
            const checked = method === methodId;
            return (
              <div
                key={methodId}
                className={`rounded-2xl border transition-colors ${checked ? "border-[#d6008a] bg-[#fff5fa]" : "border-slate-200 bg-white hover:border-pink-200"}`}
              >
                <label className="flex min-h-14 cursor-pointer items-center gap-3 p-3.5 sm:p-4">
                  <input type="radio" value={methodId} className="h-4 w-4 flex-shrink-0 accent-[#d6008a]" {...register("method")} />
                  <span
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${checked ? "bg-white text-[#d6008a]" : "bg-slate-50 text-slate-500"}`}
                  >
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14.5px] font-bold text-[#1e1a3a]">{label}</span>
                    <span className="block text-[12.5px] text-slate-500">{hint}</span>
                  </span>
                </label>

                {checked && methodId === "upi" && (
                  <div className="flex flex-col gap-3 border-t border-pink-100 px-3.5 pb-4 pt-3 sm:px-4">
                    <div className="flex flex-wrap gap-2" aria-hidden="true">
                      {UPI_APPS.map((app) => (
                        <span key={app} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] font-bold text-slate-600">
                          {app}
                        </span>
                      ))}
                    </div>
                    <Field id={id("upi")} label="UPI ID" error={errors.upiId}>
                      <input
                        id={id("upi")}
                        autoComplete="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        placeholder="name@bank"
                        className={inputClass(errors.upiId)}
                        {...register("upiId")}
                      />
                    </Field>
                  </div>
                )}

                {checked && methodId === "card" && (
                  <div className="grid gap-3 border-t border-pink-100 px-3.5 pb-4 pt-3 sm:grid-cols-2 sm:px-4">
                    <div className="sm:col-span-2">
                      <Field id={id("number")} label="Card number" error={errors.cardNumber}>
                        <input
                          id={id("number")}
                          inputMode="numeric"
                          autoComplete="cc-number"
                          placeholder="1234 5678 9012 3456"
                          maxLength={23}
                          className={inputClass(errors.cardNumber)}
                          {...formatted(register("cardNumber"), formatCardNumber)}
                        />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field id={id("name")} label="Name on card" error={errors.cardName}>
                        <input id={id("name")} autoComplete="cc-name" className={inputClass(errors.cardName)} {...register("cardName")} />
                      </Field>
                    </div>
                    <Field id={id("expiry")} label="Expiry (MM/YY)" error={errors.cardExpiry}>
                      <input
                        id={id("expiry")}
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM/YY"
                        maxLength={5}
                        className={inputClass(errors.cardExpiry)}
                        {...formatted(register("cardExpiry"), formatExpiry)}
                      />
                    </Field>
                    <Field id={id("cvv")} label="CVV" error={errors.cardCvv}>
                      <input
                        id={id("cvv")}
                        type="password"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder="•••"
                        maxLength={4}
                        className={inputClass(errors.cardCvv)}
                        {...formatted(register("cardCvv"), formatCvv)}
                      />
                    </Field>
                  </div>
                )}

                {checked && methodId === "netbanking" && (
                  <div className="border-t border-pink-100 px-3.5 pb-4 pt-3 sm:px-4">
                    <Field id={id("bank")} label="Your bank" error={errors.bank}>
                      <select id={id("bank")} className={inputClass(errors.bank)} {...register("bank")}>
                        <option value="">Select your bank</option>
                        {BANKS.map((bank) => (
                          <option key={bank} value={bank}>
                            {bank}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}

                {checked && methodId === "cod" && (
                  <p className="border-t border-pink-100 px-3.5 pb-4 pt-3 text-[13px] text-slate-600 sm:px-4">
                    Pay in cash or UPI when your order is delivered.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>
      {errors.method && (
        <p className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-rose-500">
          <AlertCircle size={13} aria-hidden="true" />
          {errors.method.message}
        </p>
      )}
    </StepCard>
  );
};

export default PaymentStep;
