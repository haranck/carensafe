import { useState } from "react";
import { m } from "framer-motion";
import { Heart } from "lucide-react";
import { useWishlistToggle } from "../../hooks/Wishlist/WishlistHooks";
import { FOCUS_RING } from "../../constants/customerTheme";

const BASE = `inline-flex flex-shrink-0 items-center justify-center rounded-full shadow-sm transition-colors duration-200 aria-disabled:cursor-wait ${FOCUS_RING}`;
const REGULAR = "h-10 w-10";
// Product cards on phones: 32px with a 16px heart (40px from sm); the invisible ::before keeps a 40px tap area
// (the cards position the button absolutely, which the ::before is placed against)
const COMPACT = "h-8 w-8 sm:h-10 sm:w-10 before:absolute before:-inset-1 before:rounded-full before:content-['']";
const ON = "bg-red-50 text-red-500 hover:bg-red-100";
const OFF = "bg-white text-slate-500 hover:text-red-500";

/**
 * Heart toggle, look only: `isWishlisted` sets the state, `onClick` does the work.
 * Clicks never reach a surrounding card link. `disabled` (pending) ignores clicks but keeps keyboard focus.
 * Needs a LazyMotion ancestor (every customer page has one) for the pop.
 */
export const WishlistHeartButton = ({ isWishlisted, onClick, disabled = false, name, size = 18, compact = false, className = "" }) => {
  // Bumped on every click: remounts the icon so the pop replays (no pop on first render)
  const [pops, setPops] = useState(0);
  const subject = name ? `${name} ` : "";

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setPops((count) => count + 1);
    onClick();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isWishlisted}
      aria-disabled={disabled}
      aria-label={isWishlisted ? `Remove ${subject}from wishlist` : `Add ${subject}to wishlist`}
      title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={`${BASE} ${compact ? COMPACT : REGULAR} ${isWishlisted ? ON : OFF} ${className}`}
    >
      <m.span
        key={pops}
        aria-hidden="true"
        initial={pops === 0 ? false : { scale: 1 }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="inline-flex"
      >
        <Heart
          size={size}
          className={`${compact ? "h-4 w-4 sm:h-[18px] sm:w-[18px]" : ""} ${isWishlisted ? "fill-red-500 text-red-500" : ""}`}
        />
      </m.span>
    </button>
  );
};

// Heart for ONE variant (size) of a product, wired to the wishlist API (optimistic; logged-out users are sent to
// login). `variantId` is required: each size is saved separately. `compact`: the smaller phone size (product cards).
const WishlistButton = ({ productId, variantId, name, size, compact, className }) => {
  const { isWishlisted, toggle, isPending } = useWishlistToggle(productId, variantId);

  return (
    <WishlistHeartButton
      isWishlisted={isWishlisted}
      onClick={toggle}
      disabled={isPending}
      name={name}
      size={size}
      compact={compact}
      className={className}
    />
  );
};

export default WishlistButton;
