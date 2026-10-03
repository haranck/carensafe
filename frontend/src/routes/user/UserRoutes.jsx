import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import PublicRoute from "../PublicRoute";
import ProtectedRoute from "../ProtectedRoute";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import SignupPage from "../../pages/Auth/SignupPage";
import LoginPage from "../../pages/Auth/LoginPage";
import LandingPage from "../../pages/LandingPage";
import PageLoader from "../../components/common/PageLoader";

const HomePage = lazy(() => import("../../pages/HomePage"));

const UserRoutes = () => {
    return (
        <Routes>
            {/* Public-only routes (redirect to /home if already logged in) */}
            <Route element={<PublicRoute />}>
                <Route path={FRONTEND_ROUTES.LANDING} element={<LandingPage />} />
                <Route path={FRONTEND_ROUTES.SIGNUP} element={<SignupPage />} />
                <Route path={FRONTEND_ROUTES.LOGIN} element={<LoginPage />} />
            </Route>

            {/* Protected routes (redirect to /login if not logged in) */}
            <Route element={<ProtectedRoute />}>
                <Route
                    path={FRONTEND_ROUTES.HOME}
                    element={
                        <Suspense fallback={<PageLoader />}>
                            <HomePage />
                        </Suspense>
                    }
                />
            </Route>
        </Routes>
    );
};

export default UserRoutes;
