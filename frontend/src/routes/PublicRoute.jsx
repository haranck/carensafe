import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { FRONTEND_ROUTES } from "../constants/frontendRoutes";

const PublicRoute = () => {
    const accessToken = useSelector((state) => state.token.accessToken);

    // If the user is already logged in, they shouldn't be on public pages (like Login/Signup).
    // Redirect them to the HOME page.
    if (accessToken) {
        return <Navigate to={FRONTEND_ROUTES.HOME} replace />;
    }
    
    // If they DON'T have a token, let them stay on this public route.
    return <Outlet />;
};

export default PublicRoute;
