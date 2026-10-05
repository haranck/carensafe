import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { postLoginPath } from "../constants/frontendRoutes";

const PublicRoute = () => {
    const accessToken = useSelector((state) => state.token.accessToken);
    const location = useLocation();

    // If the user is already logged in, they shouldn't be on public pages (like Login/Signup).
    // Redirect them to the page that sent them to login, else HOME (same target as LoginForm, which matters
    // right after login: the token update renders before LoginForm's navigation does).
    if (accessToken) {
        return <Navigate to={postLoginPath(location.state)} replace />;
    }

    // If they DON'T have a token, let them stay on this public route.
    return <Outlet />;
};

export default PublicRoute;
