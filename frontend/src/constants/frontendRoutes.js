import { generatePath } from "react-router-dom";

export const FRONTEND_ROUTES = {
  LANDING: "/",
  SIGNUP: "/signup",
  LOGIN: "/login",
  HOME: "/home",

  // Storefront & account (pages not built yet; linked from the header)
  SHOP: "/shop",
  PRODUCT_DETAIL: "/product/:id", // build links with productDetailPath()
  CARE_SHORTS: "/care-shorts",
  ABOUT: "/about",
  CONTACT: "/contact",
  CART: "/cart",
  CHECKOUT: "/checkout",
  ORDER_SUCCESS: "/order-success/:id", // build links with orderSuccessPath()
  ORDER_DETAIL: "/orders/:id", // build links with orderDetailPath()
  WISHLIST: "/wishlist",
  REWARDS: "/rewards",

  // Profile area: /profile is the dashboard, the rest are its tabs
  PROFILE: "/profile",
  PROFILE_EDIT: "/profile/edit",
  ORDERS: "/profile/orders",
  PROFILE_ADDRESSES: "/profile/addresses",
  WALLET: "/profile/wallet",

  // Admin Routes
  ADMIN_LOGIN: "/admin/login",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_USERS: "/admin/users",
  ADMIN_PRODUCTS: "/admin/products",
  ADMIN_ADD_PRODUCTS: "/admin/add-products",
  ADMIN_ORDERS: "/admin/orders",
  ADMIN_ORDER_DETAIL: "/admin/orders/:id", // build links with adminOrderDetailPath()
  ADMIN_RETURNS: "/admin/returns",
  ADMIN_SALES_REPORTS: "/admin/sales-reports",
  ADMIN_EARNINGS: "/admin/earnings",
};

// "/shop" or "/shop?combo=true" etc. (the shop keeps its filters in the URL)
export const shopPath = (params = {}) => {
  const search = new URLSearchParams(params).toString();
  return search ? `${FRONTEND_ROUTES.SHOP}?${search}` : FRONTEND_ROUTES.SHOP;
};

// Where a logged-in user can't go back to: the auth pages, and "/" (members have /home)
const NOT_AFTER_LOGIN = [FRONTEND_ROUTES.LOGIN, FRONTEND_ROUTES.SIGNUP, FRONTEND_ROUTES.LANDING];

// After login: back to the page that sent the user to login (router state `{ from: location }`, set by
// ProtectedRoute and useRequireAuth), filters / selected variant included, else home. Router state can't come
// from the URL; still, only internal paths are accepted ("/x", never "//host", "/\host" or a full URL).
export const postLoginPath = (locationState) => {
  const from = locationState?.from;
  const pathname = from?.pathname;
  const isInternal =
    typeof pathname === "string" && pathname.startsWith("/") && !pathname.startsWith("//") && !pathname.startsWith("/\\");

  if (!isInternal || NOT_AFTER_LOGIN.includes(pathname)) return FRONTEND_ROUTES.HOME;
  const search = typeof from.search === "string" && from.search.startsWith("?") ? from.search : "";
  return `${pathname}${search}`;
};

// "/product/<id>" or "/product/<id>?variant=<variantId>" (the detail page keeps the selected variant in the URL)
export const productDetailPath = (id, variantId) => {
  const path = generatePath(FRONTEND_ROUTES.PRODUCT_DETAIL, { id });
  return variantId ? `${path}?variant=${variantId}` : path;
};

export const orderDetailPath = (id) => generatePath(FRONTEND_ROUTES.ORDER_DETAIL, { id });
export const orderSuccessPath = (id) => generatePath(FRONTEND_ROUTES.ORDER_SUCCESS, { id });
export const adminOrderDetailPath = (id) => generatePath(FRONTEND_ROUTES.ADMIN_ORDER_DETAIL, { id });
