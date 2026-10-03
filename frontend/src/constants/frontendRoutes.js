import { generatePath } from "react-router-dom";

export const FRONTEND_ROUTES = {
  LANDING: "/",
  SIGNUP: "/signup",
  LOGIN: "/login",
  HOME: "/home",

  // Storefront & account (pages not built yet; linked from the header)
  SHOP: "/shop",
  PRODUCT_DETAIL: "/product/:id", // build links with productDetailPath()
  TECHNOLOGY: "/technology",
  CARE_SHORTS: "/care-shorts",
  ABOUT: "/about",
  CONTACT: "/contact",
  CART: "/cart",
  WISHLIST: "/wishlist",
  ORDERS: "/orders",
  PROFILE: "/profile",
  REWARDS: "/rewards",
  WALLET: "/wallet",

  // Admin Routes
  ADMIN_LOGIN: "/admin/login",
  ADMIN_DASHBOARD: "/admin/dashboard",
};

// "/shop" or "/shop?combo=true" etc. (the shop keeps its filters in the URL)
export const shopPath = (params = {}) => {
  const search = new URLSearchParams(params).toString();
  return search ? `${FRONTEND_ROUTES.SHOP}?${search}` : FRONTEND_ROUTES.SHOP;
};

// "/product/<id>" or "/product/<id>?variant=<variantId>" (the detail page keeps the selected variant in the URL)
export const productDetailPath = (id, variantId) => {
  const path = generatePath(FRONTEND_ROUTES.PRODUCT_DETAIL, { id });
  return variantId ? `${path}?variant=${variantId}` : path;
};
