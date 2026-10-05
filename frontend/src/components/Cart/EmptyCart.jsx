import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { FOCUS_RING, PINK_BUTTON } from "../../constants/customerTheme";

// wishlistCount > 0 adds a link to the wishlist
const EmptyCart = ({ wishlistCount = 0 }) => (
  <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-pink-200 bg-white px-6 py-14 text-center sm:py-20">
    <span className="mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-[#fff5fa]">
      <ShoppingBag size={44} strokeWidth={1.6} aria-hidden="true" className="text-pink-300" />
    </span>
    <p className="text-[18px] font-extrabold text-[#1e1a3a]">Your cart is empty</p>
    <p className="max-w-[340px] text-[13.5px] leading-relaxed text-slate-500">Looks like you haven&apos;t added anything yet</p>
    <Link
      to={FRONTEND_ROUTES.SHOP}
      className={`mt-4 inline-flex h-11 items-center gap-2 rounded-full px-6 text-[14px] font-bold ${PINK_BUTTON} ${FOCUS_RING}`}
    >
      <ShoppingBag size={16} aria-hidden="true" />
      Start Shopping
    </Link>
    {wishlistCount > 0 && (
      <Link
        to={FRONTEND_ROUTES.WISHLIST}
        className={`mt-1 inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-[13.5px] font-semibold text-[#d6008a] hover:text-[#9d0063] hover:underline ${FOCUS_RING}`}
      >
        <Heart size={15} aria-hidden="true" />
        You have {wishlistCount} {wishlistCount === 1 ? "item" : "items"} in your wishlist
      </Link>
    )}
  </div>
);

export default EmptyCart;
