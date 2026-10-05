import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { clearAdminSession } from "../../../store/slices/adminSessionSlice";
import { useAdminLogout } from "../../../hooks/Auth/AuthHooks";
import { FRONTEND_ROUTES } from "../../../constants/frontendRoutes";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

const AdminDashboardLayout = () => {
  const dispatch = useDispatch();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: logout } = useAdminLogout();

  // Revokes the admin refresh cookie, then ends only the admin session (a customer session in this browser stays)
  // and drops the cached admin data. Done even if the request fails, so logging out always works.
  const handleLogout = () =>
    logout(undefined, {
      onSettled: () => {
        dispatch(clearAdminSession());
        queryClient.removeQueries({ predicate: (query) => String(query.queryKey[0]).startsWith("admin_") });
        navigate(FRONTEND_ROUTES.ADMIN_LOGIN, { replace: true });
      },
    });

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      <AdminSidebar isSidebarOpen={isSidebarOpen} handleLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        <AdminHeader isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} handleLogout={handleLogout} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
