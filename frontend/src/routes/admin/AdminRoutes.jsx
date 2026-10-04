import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AdminLoginPage from "../../pages/Admin/Auth/AdminLoginPage";
import AdminDashboardLayout from "../../components/Layout/Admin/AdminDashboardLayout";
import AdminDashboardPage from "../../pages/Admin/Dashboard/AdminDashboardPage";
import AdminUsersPage from "../../pages/Admin/Users/AdminUsersPage";
import AdminProductsPage from "../../pages/Admin/Products/AdminProductsPage";
import AdminAddProductPage from "../../pages/Admin/Products/AdminAddProductPage";
import AdminSalesReportsPage from "../../pages/Admin/SalesReports/AdminSalesReportsPage";
import AdminEarningsPage from "../../pages/Admin/Earnings/AdminEarningsPage";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";

const AdminOrdersPage = lazy(() => import("../../pages/Admin/Orders/AdminOrdersPage"));
const AdminOrderDetailPage = lazy(() => import("../../pages/Admin/Orders/AdminOrderDetailPage"));
const AdminReturnsPage = lazy(() => import("../../pages/Admin/Returns/AdminReturnsPage"));

// Child paths are relative to the /admin/* mount
const toRelative = (path) => path.replace(/^\/admin\//, "");

const AdminPageLoader = () => (
  <div className="flex justify-center py-24">
    <Loader2 size={32} aria-label="Loading" className="animate-spin text-indigo-600" />
  </div>
);

// Lazy pages load inside the layout, so the sidebar stays while their code downloads
const withLoader = (page) => <Suspense fallback={<AdminPageLoader />}>{page}</Suspense>;

const AdminRoutes = () => {
  return (
    <Routes>
      {/* Login Route */}
      <Route path={toRelative(FRONTEND_ROUTES.ADMIN_LOGIN)} element={<AdminLoginPage />} />

      {/* Dashboard Routes wrapped in Layout */}
      <Route element={<AdminDashboardLayout />}>
        <Route path={toRelative(FRONTEND_ROUTES.ADMIN_DASHBOARD)} element={<AdminDashboardPage />} />
        <Route path={toRelative(FRONTEND_ROUTES.ADMIN_USERS)} element={<AdminUsersPage />} />
        <Route path={toRelative(FRONTEND_ROUTES.ADMIN_PRODUCTS)} element={<AdminProductsPage />} />
        <Route path={toRelative(FRONTEND_ROUTES.ADMIN_ADD_PRODUCTS)} element={<AdminAddProductPage />} />
        <Route path={toRelative(FRONTEND_ROUTES.ADMIN_ORDERS)} element={withLoader(<AdminOrdersPage />)} />
        <Route path={toRelative(FRONTEND_ROUTES.ADMIN_ORDER_DETAIL)} element={withLoader(<AdminOrderDetailPage />)} />
        <Route path={toRelative(FRONTEND_ROUTES.ADMIN_RETURNS)} element={withLoader(<AdminReturnsPage />)} />
        <Route path={toRelative(FRONTEND_ROUTES.ADMIN_SALES_REPORTS)} element={<AdminSalesReportsPage />} />
        <Route path={toRelative(FRONTEND_ROUTES.ADMIN_EARNINGS)} element={<AdminEarningsPage />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
