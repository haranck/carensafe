import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearAccessToken } from "../../../store/slices/tokenSlice";
import { clearAuth } from "../../../store/slices/authSlice";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

const AdminDashboardLayout = () => {
  const dispatch = useDispatch();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    dispatch(clearAccessToken());
    dispatch(clearAuth());
    window.location.href = "/admin/login";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      <AdminSidebar isSidebarOpen={isSidebarOpen} handleLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        <AdminHeader isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
