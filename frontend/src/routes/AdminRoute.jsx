import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { FRONTEND_ROUTES } from "../constants/frontendRoutes";

/**
 * Admin pages need an admin session (the API checks it too, on every request). Without one → admin login, which
 * brings the admin back here afterwards. `guestOnly` (the login page): already logged in → dashboard.
 */
const AdminRoute = ({ guestOnly = false }) => {
  const hasSession = useSelector((state) => Boolean(state.adminSession?.accessToken && state.adminSession?.user?.isAdmin));
  const location = useLocation();

  if (guestOnly) return hasSession ? <Navigate to={FRONTEND_ROUTES.ADMIN_DASHBOARD} replace /> : <Outlet />;
  return hasSession ? <Outlet /> : <Navigate to={FRONTEND_ROUTES.ADMIN_LOGIN} replace state={{ from: location }} />;
};

export default AdminRoute;
