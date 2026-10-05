import { Loader2, ShoppingBag, Zap } from "lucide-react";
import { BRAND_GRADIENT, FOCUS_RING } from "../../constants/customerTheme";

const BASE = `inline-flex w-full items-center justify-center whitespace-nowrap rounded-full font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`;

const OUTLINE =
  "border-2 border-[#d6008a] bg-white text-[#d6008a] hover:border-[#9d0063] hover:bg-[#fff5fa] hover:text-[#9d0063] active:scale-[0.98]";

const GRADIENT = `${BRAND_GRADIENT} text-white shadow-[0_6px_18px_rgba(124,58,237,0.28)] hover:shadow-[0_8px_24px_rgba(214,0,138,0.35)] hover:brightness-110 active:scale-[0.98]`;

const SIZES = {
  regular: "h-12 gap-2 px-5 text-[14.5px]",
  compact: "h-11 gap-1.5 px-2 text-[13px]",
};

// Add to Cart + Buy Now (info panel and the mobile sticky bar); one clear disabled button when out of stock
const PurchaseButtons = ({ inStock, isPending = false, onAddToCart, onBuyNow, compact = false }) => {
  const size = compact ? SIZES.compact : SIZES.regular;
  const iconSize = compact ? 16 : 18;

  if (!inStock) {
    return (
      <button type="button" disabled className={`${BASE} ${size} bg-slate-100 text-slate-500`}>
        Out of Stock
      </button>
    );
  }

  return (
    <div className={compact ? "grid grid-cols-2 gap-2" : "grid gap-3 sm:grid-cols-2"}>
      <button type="button" onClick={onAddToCart} disabled={isPending} className={`${BASE} ${size} ${OUTLINE}`}>
        {isPending ? (
          <Loader2 size={iconSize} aria-hidden="true" className="animate-spin" />
        ) : (
          <ShoppingBag size={iconSize} aria-hidden="true" />
        )}
        Add to Cart
      </button>
      <button type="button" onClick={onBuyNow} disabled={isPending} className={`${BASE} ${size} ${GRADIENT}`}>
        <Zap size={iconSize} aria-hidden="true" className="fill-white/30" />
        Buy Now
      </button>
    </div>
  );
};

export default PurchaseButtons;
