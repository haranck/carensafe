import axios from "axios";
import { store } from "../store/store";
import { setAccessToken, clearAccessToken } from "../store/slices/tokenSlice";
import { setAdminSession, clearAdminSession } from "../store/slices/adminSessionSlice";
import { ADMIN_ERRORS, USER_ERRORS } from "../constants/errorMessages";
import { API_ROUTES } from "../constants/apiRoutes";
import { FRONTEND_ROUTES } from "../constants/frontendRoutes";

export const AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// Admin API calls (/admin/...) use the admin session; everything else the customer session
const isAdminRequest = (config) => config?.url?.startsWith("/admin/");

AxiosInstance.interceptors.request.use((config) => {
  const state = store.getState();
  const token = isAdminRequest(config) ? state.adminSession?.accessToken : state.token?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// One refresh at a time per session: requests that fail together share it (a rotated refresh token can only be used
// once, so parallel refreshes would log the user out)
const refreshing = { user: null, admin: null };
const refreshOnce = (kind, run) => {
  if (!refreshing[kind]) {
    refreshing[kind] = run().finally(() => {
      refreshing[kind] = null;
    });
  }
  return refreshing[kind];
};

const refreshUser = () =>
  refreshOnce("user", async () => {
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/auth/refresh`, {}, { withCredentials: true });
    const accessToken = response.data?.data?.accessToken || response.data?.accessToken;
    store.dispatch(setAccessToken(accessToken));
    return accessToken;
  });

const refreshAdmin = () =>
  refreshOnce("admin", async () => {
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}${API_ROUTES.ADMIN_AUTH.REFRESH}`, {}, { withCredentials: true });
    store.dispatch(setAdminSession(response.data.data));
    return response.data.data.accessToken;
  });

const endAdminSession = () => {
  store.dispatch(clearAdminSession());
  if (!window.location.pathname.startsWith(FRONTEND_ROUTES.ADMIN_LOGIN)) {
    window.location.href = FRONTEND_ROUTES.ADMIN_LOGIN;
  }
};

// Skip token refresh for auth endpoints (login, signup, OTPs, google, forgot / reset password, admin auth)
const authPaths = ["/login", "/signup", "/verify-otp", "/resend-otp", "/google", "/forgot-password", "/verify-reset-otp", "/reset-password", "/admin/auth/"];

AxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const message = error.response?.data?.message;
    const isAuthRoute = authPaths.some((path) => originalRequest?.url?.includes(path));

    if (isAdminRequest(originalRequest)) {
      // No longer an admin (flag removed / blocked): the admin session ends
      if (status === 403 && (message === ADMIN_ERRORS.ADMIN_REQUIRED || message === USER_ERRORS.USER_BLOCKED)) {
        endAdminSession();
        return Promise.reject(error);
      }
      if (status === 401 && !originalRequest._retry && !isAuthRoute) {
        originalRequest._retry = true;
        try {
          const accessToken = await refreshAdmin();
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return AxiosInstance(originalRequest);
        } catch (refreshError) {
          endAdminSession();
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }

    if (status === 403 && message === USER_ERRORS.USER_BLOCKED) {
      store.dispatch(clearAccessToken());
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      try {
        const accessToken = await refreshUser();
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return AxiosInstance(originalRequest);
      } catch (refreshError) {
        store.dispatch(clearAccessToken());
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
