export const FRONTEND_ROUTES = {
  LANDING: "/",
  SIGNUP: "/signup",
  LOGIN: "/login",
  HOME: "/home",

  // Storefront & account (pages not built yet; linked from the header)
  SHOP: "/shop",
  PRODUCT_DETAIL: "/products/:id", // build with generatePath(FRONTEND_ROUTES.PRODUCT_DETAIL, { id })
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
