import { Routes, Route } from "react-router-dom";
import AdminLoginPage from "../../pages/Admin/Auth/AdminLoginPage";
import AdminDashboardLayout from "../../components/Layout/Admin/AdminDashboardLayout";
import AdminDashboardPage from "../../pages/Admin/Dashboard/AdminDashboardPage";

const toRelative = (path) => path.replace(/^\/admin\//, '');

const FRONTEND_ROUTES = {
  ADMIN_LOGIN: "/admin/login",
  ADMIN_DASHBOARD: "/admin/dashboard",
  // Add other routes here as they are built
};

const AdminRoutes = () => {
  return (
    <Routes>
      {/* Login Route */}
      <Route path={toRelative(FRONTEND_ROUTES.ADMIN_LOGIN)} element={<AdminLoginPage />} />

      {/* Dashboard Routes wrapped in Layout */}
      <Route element={<AdminDashboardLayout />}>
        <Route path={toRelative(FRONTEND_ROUTES.ADMIN_DASHBOARD)} element={<AdminDashboardPage />} />
        {/* Placeholder for future admin routes */}
        <Route path="users" element={<div className="p-6">Users Page Coming Soon</div>} />
        <Route path="orders" element={<div className="p-6">Orders Page Coming Soon</div>} />
        <Route path="analytics" element={<div className="p-6">Analytics Page Coming Soon</div>} />
        <Route path="settings" element={<div className="p-6">Settings Page Coming Soon</div>} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
