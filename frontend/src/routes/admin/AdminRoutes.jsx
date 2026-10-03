import { Routes, Route } from "react-router-dom";
import AdminLoginPage from "../../pages/Admin/Auth/AdminLoginPage";
import AdminDashboardLayout from "../../components/Layout/Admin/AdminDashboardLayout";
import AdminDashboardPage from "../../pages/Admin/Dashboard/AdminDashboardPage";

// Import dummy pages
import AdminUsersPage from "../../pages/Admin/Users/AdminUsersPage";
import AdminProductsPage from "../../pages/Admin/Products/AdminProductsPage";
import AdminAddProductPage from "../../pages/Admin/Products/AdminAddProductPage";
import AdminOrdersPage from "../../pages/Admin/Orders/AdminOrdersPage";
import AdminSalesReportsPage from "../../pages/Admin/SalesReports/AdminSalesReportsPage";
import AdminEarningsPage from "../../pages/Admin/Earnings/AdminEarningsPage";

const toRelative = (path) => path.replace(/^\/admin\//, '');

const FRONTEND_ROUTES = {
  ADMIN_LOGIN: "/admin/login",
  ADMIN_DASHBOARD: "/admin/dashboard",
};

const AdminRoutes = () => {
  return (
    <Routes>
      {/* Login Route */}
      <Route path={toRelative(FRONTEND_ROUTES.ADMIN_LOGIN)} element={<AdminLoginPage />} />

      {/* Dashboard Routes wrapped in Layout */}
      <Route element={<AdminDashboardLayout />}>
        <Route path={toRelative(FRONTEND_ROUTES.ADMIN_DASHBOARD)} element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="add-products" element={<AdminAddProductPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="sales-reports" element={<AdminSalesReportsPage />} />
        <Route path="earnings" element={<AdminEarningsPage />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
