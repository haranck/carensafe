import { Link } from "react-router-dom";
import { Search, X, Heart, ShoppingBag, Menu } from "lucide-react";
import UserMenu from "./UserMenu";
import HeaderSearchBar from "./HeaderSearchBar";
import { FRONTEND_ROUTES } from "../../../constants/frontendRoutes";
import { useWishlistIds } from "../../../hooks/Wishlist/WishlistHooks";
import { useCartCount } from "../../../hooks/Cart/CartHooks";
import { BRAND_GRADIENT, FOCUS_RING } from "./navConfig";

const ICON_BUTTON = `relative items-center justify-center w-10 h-10 rounded-full text-slate-600 hover:text-[#d6008a] hover:bg-pink-50 transition-colors duration-200 ${FOCUS_RING}`;

const itemCount = (count) => `${count} ${count === 1 ? "item" : "items"}`;

const CountBadge = ({ count }) =>
  count > 0 ? (
    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#d6008a] text-white text-[10px] font-bold leading-[18px] text-center ring-2 ring-white">
      {count > 99 ? "99+" : count}
    </span>
  ) : null;

const HeaderActions = ({
  isLoggedIn,
  user,
  isSearchOpen,
  searchId,
  onToggleSearch,
  isDrawerOpen,
  drawerId,
  onOpenDrawer,
  onLogout,
}) => {
  const { data: cartCount = 0 } = useCartCount();
  const { data: wishlistIds } = useWishlistIds();
  const wishlistCount = wishlistIds?.size || 0;

  return (
    <div className="flex items-center gap-1">
      <div className="mr-2">
        <HeaderSearchBar />
      </div>

      <button
        type="button"
        data-search-toggle
        onClick={onToggleSearch}
        aria-label={isSearchOpen ? "Close search" : "Search products"}
        title="Search"
        aria-expanded={isSearchOpen}
        aria-controls={searchId}
        className={`hidden lg:inline-flex xl:hidden ${ICON_BUTTON}`}
      >
        {isSearchOpen ? <X size={19} strokeWidth={1.9} /> : <Search size={19} strokeWidth={1.9} />}
      </button>

      <Link
        to={FRONTEND_ROUTES.WISHLIST}
        aria-label={wishlistCount ? `Wishlist, ${itemCount(wishlistCount)}` : "Wishlist"}
        title="Wishlist"
        className={`hidden lg:inline-flex ${ICON_BUTTON}`}
      >
        <Heart size={19} strokeWidth={1.9} />
        <CountBadge count={wishlistCount} />
      </Link>

      <Link
        to={FRONTEND_ROUTES.CART}
        aria-label={cartCount ? `Cart, ${itemCount(cartCount)}` : "Cart"}
        title="Cart"
        className={`inline-flex ${ICON_BUTTON}`}
      >
        <ShoppingBag size={19} strokeWidth={1.9} />
        <CountBadge count={cartCount} />
      </Link>

      <div className="hidden lg:flex items-center gap-2 pl-3 ml-2 border-l border-slate-200">
        {isLoggedIn ? (
          <UserMenu user={user} onLogout={onLogout} />
        ) : (
          <>
            <Link
              to={FRONTEND_ROUTES.LOGIN}
              className={`inline-flex items-center h-10 px-3 rounded-full text-[13.5px] font-semibold text-[#1e1a3a] hover:text-[#d6008a] transition-colors ${FOCUS_RING}`}
            >
              Login
            </Link>
            <Link
              to={FRONTEND_ROUTES.SIGNUP}
              className={`inline-flex items-center h-10 px-5 rounded-full text-[13.5px] font-bold text-white ${BRAND_GRADIENT} shadow-[0_4px_14px_rgba(214,0,138,0.25)] hover:opacity-90 hover:-translate-y-px transition-all duration-200 ${FOCUS_RING}`}
            >
              Sign Up
            </Link>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenDrawer}
        aria-label="Open menu"
        title="Menu"
        aria-expanded={isDrawerOpen}
        aria-controls={drawerId}
        className={`inline-flex lg:hidden ${ICON_BUTTON}`}
      >
        <Menu size={21} strokeWidth={1.9} />
      </button>
    </div>
  );
};

export default HeaderActions;
