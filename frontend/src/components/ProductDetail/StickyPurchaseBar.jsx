import { AnimatePresence, m } from "framer-motion";
import PurchaseButtons from "./PurchaseButtons";
import { formatPrice } from "../../utils/product";

// Mobile-only bottom bar, shown once the main purchase buttons have scrolled out of view
const StickyPurchaseBar = ({ isVisible, variant, quantity, isPending, onAddToCart, onBuyNow }) => (
  <AnimatePresence>
    {isVisible && (
      <m.div
        role="region"
        aria-label="Quick purchase"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed inset-x-0 bottom-0 z-[90] border-t border-pink-100 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_-18px_rgba(59,42,138,0.35)] backdrop-blur-md md:hidden"
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-shrink-0">
            <p className="text-[18px] font-extrabold leading-none text-[#1e1a3a]">{formatPrice(variant.price)}</p>
            <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">
              Size {variant.size}
              {quantity > 1 && ` · Qty ${quantity}`}
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <PurchaseButtons
              compact
              inStock={variant.stock > 0}
              isPending={isPending}
              onAddToCart={onAddToCart}
              onBuyNow={onBuyNow}
            />
          </div>
        </div>
      </m.div>
    )}
  </AnimatePresence>
);

export default StickyPurchaseBar;
