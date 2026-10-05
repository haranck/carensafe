import { ArrowRight } from "lucide-react";
import { BRAND_GRADIENT, FOCUS_RING } from "../../constants/customerTheme";
import { formatPrice } from "../../utils/product";

// Phones / tablets: total + Checkout pinned to the bottom (the summary card sits below the items there)
const MobileCheckoutBar = ({ total, itemCount, canCheckout, onCheckout }) => (
  <div className="fixed inset-x-0 bottom-0 z-40 border-t border-pink-100 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(59,42,138,0.25)] backdrop-blur-md lg:hidden">
    <div className="mx-auto flex max-w-[640px] items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[11.5px] font-semibold text-slate-500">
          Total ({itemCount} {itemCount === 1 ? "item" : "items"})
        </p>
        <p className="text-[19px] font-extrabold leading-tight text-[#1e1a3a]">{formatPrice(total)}</p>
      </div>
      <button
        type="button"
        onClick={onCheckout}
        disabled={!canCheckout}
        className={`inline-flex h-12 flex-shrink-0 items-center gap-2 rounded-full px-6 text-[15px] font-bold text-white ${BRAND_GRADIENT} shadow-[0_6px_18px_rgba(124,58,237,0.28)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none transition-all duration-200 ${FOCUS_RING}`}
      >
        Checkout
        <ArrowRight size={18} aria-hidden="true" />
      </button>
    </div>
  </div>
);

export default MobileCheckoutBar;
