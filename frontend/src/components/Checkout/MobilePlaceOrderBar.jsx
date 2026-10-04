import { PlaceOrderButton } from "./CheckoutSummary";
import { formatPrice } from "../../utils/product";

// Phones / tablets: total + Place Order pinned to the bottom (the summary is collapsed at the top there)
const MobilePlaceOrderBar = ({ total, blockedReason, canPlaceOrder, isPlacing, onPlaceOrder }) => (
  <div className="fixed inset-x-0 bottom-0 z-40 border-t border-pink-100 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(59,42,138,0.25)] backdrop-blur-md lg:hidden">
    <div className="mx-auto flex max-w-[640px] items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11.5px] font-semibold text-slate-500">Total</p>
        <p className="text-[19px] font-extrabold leading-tight text-[#1e1a3a]">{formatPrice(total)}</p>
        {blockedReason && <p className="truncate text-[11px] text-slate-500">{blockedReason}</p>}
      </div>
      <PlaceOrderButton canPlaceOrder={canPlaceOrder} isPlacing={isPlacing} onPlaceOrder={onPlaceOrder} className="flex-shrink-0" />
    </div>
  </div>
);

export default MobilePlaceOrderBar;
