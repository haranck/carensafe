import { Link, matchPath, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Heart, Home, Store, User } from "lucide-react";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { useWishlistIds } from "../../hooks/Wishlist/WishlistHooks";
import { FOCUS_RING, showsBottomNav } from "./HeaderParts/navConfig";

const isActive = (patterns, pathname) => patterns.some((pattern) => matchPath({ path: pattern, end: false }, pathname));

/**
 * Phones / tablets (below lg): app-style tab bar pinned to the bottom — Home, Shop, Wishlist, Profile. Guests go to
 * the landing page / login. Hidden on pages with their own bottom action bar (cart, checkout, product).
 */
const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const isLoggedIn = useSelector((state) => Boolean(state.token.accessToken));
  const { data: wishlistIds } = useWishlistIds();
  const wishlistCount = wishlistIds?.size || 0;

  if (!showsBottomNav(pathname)) return null;

  const tabs = [
    {
      label: "Home",
      icon: Home,
      to: isLoggedIn ? FRONTEND_ROUTES.HOME : FRONTEND_ROUTES.LANDING,
      active: pathname === FRONTEND_ROUTES.LANDING || pathname === FRONTEND_ROUTES.HOME,
    },
    { label: "Shop", icon: Store, to: FRONTEND_ROUTES.SHOP, active: isActive([FRONTEND_ROUTES.SHOP], pathname) },
    {
      label: "Wishlist",
      icon: Heart,
      to: FRONTEND_ROUTES.WISHLIST,
      active: isActive([FRONTEND_ROUTES.WISHLIST], pathname),
      badge: wishlistCount,
    },
    {
      label: "Profile",
      icon: User,
      to: isLoggedIn ? FRONTEND_ROUTES.PROFILE : FRONTEND_ROUTES.LOGIN,
      active: isActive([FRONTEND_ROUTES.PROFILE, FRONTEND_ROUTES.LOGIN, FRONTEND_ROUTES.SIGNUP, "/orders/*"], pathname),
    },
  ];

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 lg:hidden"
    >
      <ul className="mx-auto grid max-w-[520px] grid-cols-4 rounded-[22px] border border-pink-100 bg-white/95 px-1 py-1.5 shadow-[0_-6px_24px_-10px_rgba(59,42,138,0.25),0_8px_24px_-12px_rgba(59,42,138,0.25)] backdrop-blur-md">
        {tabs.map(({ label, icon: Icon, to, active, badge }) => (
          <li key={label}>
            <Link
              to={to}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11.5px] font-semibold transition-colors ${
                active ? "text-[#d6008a]" : "text-slate-500 hover:text-[#1e1a3a]"
              } ${FOCUS_RING}`}
            >
              <span
                className={`relative flex h-8 w-12 items-center justify-center rounded-full transition-colors ${active ? "bg-[#fff0f7]" : ""}`}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.9} aria-hidden="true" />
                {badge > 0 && (
                  <span className="absolute -top-1 right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#d6008a] px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {badge > 99 ? "99+" : badge}
                    <span className="sr-only"> items</span>
                  </span>
                )}
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
