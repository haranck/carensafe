import { Truck } from "lucide-react";
import { formatPrice } from "../../utils/product";

// Native <progress> (accessible, no inline width), styled through its pseudo-elements
const PROGRESS =
  "mt-2.5 block h-2 w-full appearance-none overflow-hidden rounded-full bg-pink-100 [&::-webkit-progress-bar]:bg-pink-100 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-[#d6008a] [&::-webkit-progress-value]:to-[#9d0063] [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-[#d6008a]";

// "Add ₹X more for FREE delivery" with a progress bar, or the unlocked message (always, while shipping is free)
const FreeShippingBar = ({ summary }) => {
  const remaining = summary.amountForFreeShipping;

  if (remaining <= 0) {
    return (
      <p className="flex items-center gap-2.5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[13.5px] font-semibold text-emerald-700">
        <Truck size={18} aria-hidden="true" className="flex-shrink-0" />
        You&apos;ve unlocked FREE delivery 🎉
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-pink-100 bg-[#fff5fa] px-4 py-3">
      <p className="flex flex-wrap items-center gap-x-1.5 text-[13.5px] font-semibold text-[#1e1a3a]">
        <Truck size={18} aria-hidden="true" className="flex-shrink-0 text-[#d6008a]" />
        Add <span className="font-extrabold text-[#d6008a]">{formatPrice(remaining)}</span> more for FREE delivery
      </p>
      <progress
        value={summary.subtotal}
        max={summary.freeShippingThreshold}
        aria-label="Progress towards free delivery"
        className={PROGRESS}
      />
    </div>
  );
};

export default FreeShippingBar;
