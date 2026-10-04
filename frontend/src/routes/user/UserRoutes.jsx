import { lazy, Suspense, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import PublicRoute from "../PublicRoute";
import ProtectedRoute from "../ProtectedRoute";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import SignupPage from "../../pages/Auth/SignupPage";
import LoginPage from "../../pages/Auth/LoginPage";
import PageLoader from "../../components/common/PageLoader";
import { runWhenIdle } from "../../utils/idle";

const loadLandingPage = () => import("../../pages/LandingPage");
const loadHomePage = () => import("../../pages/HomePage");
const loadShopPage = () => import("../../pages/Shop/ShopPage");
const loadProductDetailPage = () => import("../../pages/Products/ProductDetailPage");

// Landing and Home share the home sections, so they share most of their chunk
const LandingPage = lazy(loadLandingPage);
const HomePage = lazy(loadHomePage);
const ShopPage = lazy(loadShopPage);
const ProductDetailPage = lazy(loadProductDetailPage);
const WishlistPage = lazy(() => import("../../pages/Wishlist/WishlistPage"));
const CartPage = lazy(() => import("../../pages/Cart/CartPage"));
const CheckoutPage = lazy(() => import("../../pages/Checkout/CheckoutPage"));
const OrderSuccessPage = lazy(() => import("../../pages/Checkout/OrderSuccessPage"));
const OrderDetailPage = lazy(() => import("../../pages/Orders/OrderDetailPage"));
const ProfileLayout = lazy(() => import("../../pages/Profile/ProfileLayout"));
const ProfileDashboardPage = lazy(() => import("../../pages/Profile/ProfileDashboardPage"));
const ProfileEditPage = lazy(() => import("../../pages/Profile/ProfileEditPage"));
const ProfileOrdersPage = lazy(() => import("../../pages/Profile/ProfileOrdersPage"));
const ProfileAddressesPage = lazy(() => import("../../pages/Profile/ProfileAddressesPage"));
const ProfileWalletPage = lazy(() => import("../../pages/Profile/ProfileWalletPage"));
const ComingSoonPage = lazy(() => import("../../pages/ComingSoon/ComingSoonPage"));

// Download the lazy pages' code while the browser is idle, so moving between pages never waits on it
const usePreloadPages = () => {
    useEffect(
        () =>
            runWhenIdle(() => {
                loadLandingPage();
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
                {/* Guests only: logged-in users go to /home (or back to where the login gate sent them from) */}
                <Route element={<PublicRoute />}>
                    <Route path={FRONTEND_ROUTES.LANDING} element={<LandingPage />} />
                    <Route path={FRONTEND_ROUTES.SIGNUP} element={<SignupPage />} />
                    <Route path={FRONTEND_ROUTES.LOGIN} element={<LoginPage />} />
                </Route>

                {/* Open to everyone, logged in or not (actions that need an account go through useRequireAuth) */}
                <Route path={FRONTEND_ROUTES.SHOP} element={<ShopPage />} />
                <Route path={FRONTEND_ROUTES.PRODUCT_DETAIL} element={<ProductDetailPage />} />

                {/* Member home; guests are sent to the landing page (same sections) quietly */}
                <Route element={<ProtectedRoute guestRedirect={FRONTEND_ROUTES.LANDING} />}>
                    <Route path={FRONTEND_ROUTES.HOME} element={<HomePage />} />
                </Route>

                {/* Account pages: guests get the login toast, log in, then come back here */}
                <Route element={<ProtectedRoute />}>
                    <Route path={FRONTEND_ROUTES.WISHLIST} element={<WishlistPage />} />
                    <Route path={FRONTEND_ROUTES.CART} element={<CartPage />} />
                    <Route path={FRONTEND_ROUTES.CHECKOUT} element={<CheckoutPage />} />
                    <Route path={FRONTEND_ROUTES.ORDER_SUCCESS} element={<OrderSuccessPage />} />
                    <Route path={FRONTEND_ROUTES.ORDER_DETAIL} element={<OrderDetailPage />} />
                    <Route path={FRONTEND_ROUTES.REWARDS} element={<ComingSoonPage />} />

                    {/* Profile area: shared sidebar / tab layout, each tab its own lazy chunk */}
                    <Route path={FRONTEND_ROUTES.PROFILE} element={<ProfileLayout />}>
                        <Route index element={<ProfileDashboardPage />} />
                        <Route path={FRONTEND_ROUTES.PROFILE_EDIT} element={<ProfileEditPage />} />
                        <Route path={FRONTEND_ROUTES.ORDERS} element={<ProfileOrdersPage />} />
                        <Route path={FRONTEND_ROUTES.PROFILE_ADDRESSES} element={<ProfileAddressesPage />} />
                        <Route path={FRONTEND_ROUTES.WALLET} element={<ProfileWalletPage />} />
                    </Route>
                </Route>
            </Routes>
        </Suspense>
    );
};

export default UserRoutes;
