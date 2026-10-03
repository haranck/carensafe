import { lazy, Suspense, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import PublicRoute from "../PublicRoute";
import ProtectedRoute from "../ProtectedRoute";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import SignupPage from "../../pages/Auth/SignupPage";
import LoginPage from "../../pages/Auth/LoginPage";
import LandingPage from "../../pages/LandingPage";
import PageLoader from "../../components/common/PageLoader";
import { runWhenIdle } from "../../utils/idle";

const loadHomePage = () => import("../../pages/HomePage");
const loadShopPage = () => import("../../pages/Shop/ShopPage");
const loadProductDetailPage = () => import("../../pages/Products/ProductDetailPage");

const HomePage = lazy(loadHomePage);
const ShopPage = lazy(loadShopPage);
const ProductDetailPage = lazy(loadProductDetailPage);

// Download the lazy pages' code while the browser is idle, so moving between pages never waits on it
const usePreloadPages = () => {
    useEffect(
        () =>
            runWhenIdle(() => {
                loadHomePage();
                loadShopPage();
                loadProductDetailPage();
            }),
        []
    );
};

const UserRoutes = () => {
    usePreloadPages();

    // One boundary for every page: navigations run in a transition (React Router's default), so the current
    // page stays on screen until the next one is ready. The loader only shows on the very first load.
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                {/* Public-only routes (redirect to /home if already logged in) */}
                <Route element={<PublicRoute />}>
                    <Route path={FRONTEND_ROUTES.LANDING} element={<LandingPage />} />
                    <Route path={FRONTEND_ROUTES.SIGNUP} element={<SignupPage />} />
                    <Route path={FRONTEND_ROUTES.LOGIN} element={<LoginPage />} />
                </Route>

                {/* Open to everyone, logged in or not */}
                <Route path={FRONTEND_ROUTES.SHOP} element={<ShopPage />} />
                <Route path={FRONTEND_ROUTES.PRODUCT_DETAIL} element={<ProductDetailPage />} />

                {/* Protected routes (redirect to /login if not logged in) */}
                <Route element={<ProtectedRoute />}>
                    <Route path={FRONTEND_ROUTES.HOME} element={<HomePage />} />
                </Route>
            </Routes>
        </Suspense>
    );
};

export default UserRoutes;
