import { useId } from "react";
import { ArrowRight, Leaf, RotateCcw, ShieldCheck } from "lucide-react";
import { BRAND_GRADIENT, FOCUS_RING } from "../../constants/customerTheme";
import { formatPrice } from "../../utils/product";

const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Secure Payment" },
  { icon: Leaf, label: "100% Organic Cotton" },
  { icon: RotateCcw, label: "Easy Returns" },
];

const itemsLabel = (count) => `${count} ${count === 1 ? "item" : "items"}`;

const Row = ({ label, valueClassName = "text-[#1e1a3a]", children }) => (
  <div className="flex items-center justify-between gap-4 text-[14px]">
    <dt className="text-slate-500">{label}</dt>
    <dd className={`font-semibold ${valueClassName}`}>{children}</dd>
  </div>
);

// Totals exactly as the API computed them (summary from GET /user/cart); dimmed while an update is on its way
const OrderSummary = ({ summary, canCheckout, onCheckout, isUpdating = false }) => {
  const headingId = useId();
  const isFreeShipping = summary.shipping === 0;

  return (
    <section
      aria-labelledby={headingId}
      aria-busy={isUpdating}
      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_18px_-12px_rgba(59,42,138,0.18)] sm:p-6"
    >
      <h2 id={headingId} className="text-[17px] font-extrabold text-[#1e1a3a]">
        Order Summary
      </h2>

      <div className={`transition-opacity duration-200 ${isUpdating ? "opacity-60" : "opacity-100"}`}>
        <dl className="mt-4 flex flex-col gap-3">
          <Row label={`Price (${itemsLabel(summary.itemCount)})`}>{formatPrice(summary.mrpTotal)}</Row>
          {summary.savings > 0 && (
            <Row label="Discount" valueClassName="text-emerald-600">
              − {formatPrice(summary.savings)}
            </Row>
          )}
          <Row label="Shipping" valueClassName={isFreeShipping ? "text-emerald-600" : "text-[#1e1a3a]"}>
            {isFreeShipping ? "FREE" : formatPrice(summary.shipping)}
          </Row>
        </dl>

        <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-slate-100 pt-4">
          <span className="text-[15px] font-bold text-[#1e1a3a]">Total Amount</span>
          <span className="text-[22px] font-extrabold text-[#1e1a3a]">{formatPrice(summary.total)}</span>
        </div>

        {summary.savings > 0 && (
          <p className="mt-3 rounded-full bg-emerald-50 px-4 py-2 text-center text-[13px] font-bold text-emerald-700">
            You save {formatPrice(summary.savings)} on this order
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onCheckout}
        disabled={!canCheckout}
        className={`mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-bold text-white ${BRAND_GRADIENT} shadow-[0_6px_18px_rgba(124,58,237,0.28)] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none transition-all duration-200 ${FOCUS_RING}`}
      >
        Proceed to Checkout
        <ArrowRight size={18} aria-hidden="true" />
      </button>
      {!canCheckout && (
        <p className="mt-2 text-center text-[12px] text-slate-500">None of these items can be ordered right now.</p>
      )}

      <ul className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
        {TRUST_POINTS.map(({ icon: Icon, label }) => (
          <li key={label} className="flex flex-col items-center gap-1.5 text-center text-[11px] font-semibold leading-tight text-slate-500">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff5fa] text-[#d6008a]">
              <Icon size={17} aria-hidden="true" />
            </span>
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default OrderSummary;
