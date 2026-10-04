import { useState } from "react";
import { m } from "framer-motion";
import { Heart } from "lucide-react";
import { useWishlistToggle } from "../../hooks/Wishlist/WishlistHooks";
import { FOCUS_RING } from "../../constants/customerTheme";

const BASE = `inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full shadow-sm transition-colors duration-200 aria-disabled:cursor-wait ${FOCUS_RING}`;
const ON = "bg-red-50 text-red-500 hover:bg-red-100";
const OFF = "bg-white text-slate-500 hover:text-red-500";

/**
 * Heart toggle, look only: `isWishlisted` sets the state, `onClick` does the work.
 * Clicks never reach a surrounding card link. `disabled` (pending) ignores clicks but keeps keyboard focus.
 * Needs a LazyMotion ancestor (every customer page has one) for the pop.
 */
export const WishlistHeartButton = ({ isWishlisted, onClick, disabled = false, name, size = 18, className = "" }) => {
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
      className={`${BASE} ${isWishlisted ? ON : OFF} ${className}`}
    >
      <m.span
        key={pops}
        aria-hidden="true"
        initial={pops === 0 ? false : { scale: 1 }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="inline-flex"
      >
        <Heart size={size} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
      </m.span>
    </button>
  );
};

// Heart wired to the wishlist API (optimistic; logged-out users are sent to login)
const WishlistButton = ({ productId, variantId, name, size, className }) => {
  const { isWishlisted, toggle, isPending } = useWishlistToggle(productId, variantId);

  return (
    <WishlistHeartButton
      isWishlisted={isWishlisted}
      onClick={toggle}
      disabled={isPending}
      name={name}
      size={size}
      className={className}
    />
  );
};

export default WishlistButton;
