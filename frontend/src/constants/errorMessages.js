// Admin API refusals that end the admin session (must match admin.auth.service exactly)
export const ADMIN_ERRORS = {
  ADMIN_REQUIRED: "Admin access required.",
};

export const USER_ERRORS = {
  USER_BLOCKED: "Your account is blocked.", // Must match the backend's blocked message exactly (login, refresh, authMiddleware)
};
