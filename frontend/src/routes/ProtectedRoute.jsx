import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { FRONTEND_ROUTES } from "../constants/frontendRoutes";
import { showLoginRequired } from "../hooks/Auth/useRequireAuth";

// Guest opening a protected page: toast (in an effect, never during render) + login, which brings them back here
const LoginRedirect = ({ from }) => {
  useEffect(() => {
    showLoginRequired();
  }, []);

  return <Navigate to={FRONTEND_ROUTES.LOGIN} replace state={{ from }} />;
};

/**
 * Pages that need an account. `guestRedirect` sends guests there quietly instead (/home → the public landing page).
 *
 * The token disappearing while a member is on the page (logout, session ended) only redirects to login, with no
 * "please log in" toast: navigations run as transitions, so this renders without a token before the logout's own
 * navigation lands.
 */
const ProtectedRoute = ({ guestRedirect }) => {
  const accessToken = useSelector((state) => state.token.accessToken);
  const location = useLocation();

  // Whether this visit was logged in at some point (state adjusted during render, no effect needed)
  const [wasLoggedIn, setWasLoggedIn] = useState(Boolean(accessToken));
  if (accessToken && !wasLoggedIn) setWasLoggedIn(true);

  if (accessToken) return <Outlet />;
  if (wasLoggedIn) return <Navigate to={FRONTEND_ROUTES.LOGIN} replace />;
  if (guestRedirect) return <Navigate to={guestRedirect} replace />;
  return <LoginRedirect from={location} />;
};

export default ProtectedRoute;
