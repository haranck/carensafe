import { useId, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Leaf, Loader2, Lock, RotateCcw, ShieldCheck, Tag } from "lucide-react";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { BRAND_GRADIENT, FOCUS_RING } from "../../constants/customerTheme";
import { formatPrice, productTitle } from "../../utils/product";

const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Secure Checkout" },
  { icon: Leaf, label: "100% Organic Cotton" },
  { icon: RotateCcw, label: "Easy Returns" },
];

const Row = ({ label, valueClassName = "text-[#1e1a3a]", children }) => (
  <div className="flex items-center justify-between gap-4 text-[14px]">
    <dt className="text-slate-500">{label}</dt>
    <dd className={`font-semibold ${valueClassName}`}>{children}</dd>
  </div>
);

const ItemRow = ({ item }) => {
  const meta = [item.size && `Size ${item.size}`, item.pieces && `${item.pieces} pcs`].filter(Boolean).join(" · ");
  return (
    <li className="flex gap-3">
      <span className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-[#fff5fa]">
        {item.image ? (
          <img src={item.image} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
        ) : (
          <Leaf size={20} aria-hidden="true" className="text-pink-300" />
        )}
        <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-bl-lg bg-[#1e1a3a] px-1 text-[10.5px] font-bold text-white">
          {item.quantity}
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-[#1e1a3a]">{productTitle(item.name, item.variantName)}</p>
        {meta && <p className="mt-0.5 text-[12px] text-slate-500">{meta}</p>}
        <p className="mt-0.5 text-[12px] text-slate-500">
          {item.quantity} × {formatPrice(item.price)}
        </p>
      </div>
      <p className="flex-shrink-0 text-[13.5px] font-bold text-[#1e1a3a]">{formatPrice(item.lineTotal)}</p>
    </li>
  );
};

/**
 * Right column: items, coupon (dummy), totals (from checkoutTotals) and Place Order.
 * The button shows from lg up; on phones the sticky bottom bar has it. `blockedReason` says what's still missing.
 */
const CheckoutSummary = ({ items, totals, canPlaceOrder, isPlacing, onPlaceOrder, blockedReason }) => {
  const headingId = useId();
  const couponId = useId();
  const [coupon, setCoupon] = useState("");

  const handleCoupon = (event) => {
    event.preventDefault();
    toast("Coupons are coming soon", { id: "coupon-soon", icon: <Tag size={18} aria-hidden="true" /> });
  };

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_4px_18px_-12px_rgba(59,42,138,0.18)] sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="text-[17px] font-extrabold text-[#1e1a3a]">
          Order Summary
        </h2>
        <Link
          to={FRONTEND_ROUTES.CART}
          className={`inline-flex min-h-10 items-center rounded-full px-2 text-[13px] font-bold text-[#d6008a] hover:text-[#9d0063] ${FOCUS_RING}`}
        >
          Edit cart
        </Link>
      </div>

      <ul className="mt-3 flex max-h-72 flex-col gap-4 overflow-y-auto pr-1">
        {items.map((item) => (
          <ItemRow key={item.itemId} item={item} />
        ))}
      </ul>

      <form onSubmit={handleCoupon} className="mt-5 border-t border-slate-100 pt-4">
        <label htmlFor={couponId} className="text-[12px] font-bold uppercase tracking-wide text-slate-500">
          Coupon code
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            id={couponId}
            value={coupon}
            onChange={(event) => setCoupon(event.target.value.toUpperCase())}
            placeholder="Enter code"
            autoComplete="off"
            className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 text-[14px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-[#d6008a] focus:shadow-[0_0_0_3px_rgba(214,0,138,0.12)]"
          />
          <button
            type="submit"
            className={`inline-flex h-11 flex-shrink-0 items-center rounded-xl border border-[#d6008a] px-4 text-[13.5px] font-bold text-[#d6008a] hover:bg-[#fff5fa] hover:text-[#9d0063] transition-colors ${FOCUS_RING}`}
          >
            Apply
          </button>
        </div>
      </form>

      <dl className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4">
        <Row label={`Subtotal (${totals.itemCount} ${totals.itemCount === 1 ? "item" : "items"})`}>{formatPrice(totals.subtotal)}</Row>
        <Row label="Discount" valueClassName={totals.discount > 0 ? "text-emerald-600" : "text-[#1e1a3a]"}>
          {totals.discount > 0 ? `− ${formatPrice(totals.discount)}` : formatPrice(0)}
        </Row>
        <Row label="Shipping" valueClassName={totals.shipping === 0 ? "text-emerald-600" : "text-[#1e1a3a]"}>
          {totals.shipping === 0 ? "FREE" : formatPrice(totals.shipping)}
        </Row>
      </dl>

      <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-slate-100 pt-4">
        <span className="text-[15px] font-bold text-[#1e1a3a]">Total Amount</span>
        <span className="text-[22px] font-extrabold text-[#1e1a3a]">{formatPrice(totals.total)}</span>
      </div>

      <div className="hidden lg:block">
        <PlaceOrderButton canPlaceOrder={canPlaceOrder} isPlacing={isPlacing} onPlaceOrder={onPlaceOrder} className="mt-5 w-full" />
        {blockedReason && <p className="mt-2 text-center text-[12px] text-slate-500">{blockedReason}</p>}
      </div>

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

export const PlaceOrderButton = ({ canPlaceOrder, isPlacing, onPlaceOrder, className = "" }) => (
  <button
    type="button"
    onClick={onPlaceOrder}
    disabled={!canPlaceOrder || isPlacing}
    className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold text-white ${BRAND_GRADIENT} shadow-[0_6px_18px_rgba(124,58,237,0.28)] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none transition-all duration-200 ${FOCUS_RING} ${className}`}
  >
    {isPlacing ? <Loader2 size={18} aria-hidden="true" className="animate-spin" /> : <Lock size={16} aria-hidden="true" />}
    {isPlacing ? "Placing order…" : "Place Order"}
  </button>
);

export default CheckoutSummary;
