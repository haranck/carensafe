import { Truck, ShieldCheck, Heart, Leaf, User, Package, Gift, Wallet } from "lucide-react";
import { FRONTEND_ROUTES } from "../../../constants/frontendRoutes";
import { matchPath } from "react-router-dom";

export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6008a]/30";

export const BRAND_GRADIENT = "bg-gradient-to-r from-[#3b2a8a] via-[#231043] to-[#d6008a]";

export const TRUST_POINTS = [
  { icon: Truck, label: "Free Delivery Above ₹399" },
  { icon: ShieldCheck, label: "NABL Certified" },
  { icon: Heart, label: "25 Lakh+ Happy Women" },
  { icon: Leaf, label: "100% Organic Cotton" },
];

// `authTo` overrides `to` when logged in ("/" redirects logged-in users via PublicRoute)
export const NAV_LINKS = [
  { label: "Home", to: FRONTEND_ROUTES.LANDING, authTo: FRONTEND_ROUTES.HOME },
  { label: "Shop", to: FRONTEND_ROUTES.SHOP },
  { label: "Care Shorts", to: FRONTEND_ROUTES.CARE_SHORTS },
  { label: "About Us", to: FRONTEND_ROUTES.ABOUT },
  { label: "Contact", to: FRONTEND_ROUTES.CONTACT },
];

export const ACCOUNT_LINKS = [
  { label: "My Profile", icon: User, to: FRONTEND_ROUTES.PROFILE_EDIT },
  { label: "My Orders", icon: Package, to: FRONTEND_ROUTES.ORDERS },
  { label: "Wishlist", icon: Heart, to: FRONTEND_ROUTES.WISHLIST },
  { label: "Rewards", icon: Gift, to: FRONTEND_ROUTES.REWARDS },
  // Shows the live wallet balance (useWalletBalance) next to the label
  { label: "Wallet", icon: Wallet, to: FRONTEND_ROUTES.WALLET, showsWalletBalance: true },
];

export const resolveNavPath = (link, isLoggedIn) => (isLoggedIn && link.authTo) || link.to;

// Search is UI-only for now: hands the term to the (future) Shop page as ?search=
export const buildShopSearch = (term) => ({
  pathname: FRONTEND_ROUTES.SHOP,
  search: `?${new URLSearchParams({ search: term })}`,
});

export const getInitials = (user) => {
  const first = user?.firstName?.trim()?.[0] || "";
  const last = user?.lastName?.trim()?.[0] || "";
  return (first + last).toUpperCase() || "U";
};

// Phones / tablets: the bottom tab bar is hidden on pages that pin their own action bar to the bottom
const OWN_BOTTOM_BAR = [FRONTEND_ROUTES.CART, FRONTEND_ROUTES.CHECKOUT, FRONTEND_ROUTES.PRODUCT_DETAIL];
export const showsBottomNav = (pathname) => !OWN_BOTTOM_BAR.some((pattern) => matchPath(pattern, pathname));
