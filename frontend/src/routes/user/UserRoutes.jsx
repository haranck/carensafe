import { Routes, Route } from "react-router-dom";
import PublicRoute from "../PublicRoute";
import ProtectedRoute from "../ProtectedRoute";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import SignupPage from "../../pages/Auth/SignupPage";
import LoginPage from "../../pages/Auth/LoginPage";
import LandingPage from "../../pages/LandingPage";
import HomePage from "../../pages/HomePage";

const UserRoutes = () => {
    return (
        <Routes>
            {/* Landing page — visible to everyone */}
            <Route path={FRONTEND_ROUTES.LANDING} element={<LandingPage />} />

            {/* Public-only routes (redirect to /home if already logged in) */}
            <Route element={<PublicRoute />}>
                <Route path={FRONTEND_ROUTES.SIGNUP} element={<SignupPage />} />
                <Route path={FRONTEND_ROUTES.LOGIN} element={<LoginPage />} />
            </Route>

            {/* Protected routes (redirect to /login if not logged in) */}
            <Route element={<ProtectedRoute />}>
                <Route path={FRONTEND_ROUTES.HOME} element={<HomePage />} />
            </Route>
        </Routes>
    );
};

export default UserRoutes;
