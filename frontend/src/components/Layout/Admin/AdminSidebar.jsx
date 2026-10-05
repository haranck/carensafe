import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Package, ShoppingBag, BarChart2, Wallet, PlusCircle, RotateCcw } from "lucide-react";
import { FRONTEND_ROUTES } from "../../../constants/frontendRoutes";
import { useGetAdminOrderStats } from "../../../hooks/Admin/OrderHooks";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: FRONTEND_ROUTES.ADMIN_DASHBOARD },
  { label: "User Management", icon: Users, path: FRONTEND_ROUTES.ADMIN_USERS },
  { label: "Products", icon: Package, path: FRONTEND_ROUTES.ADMIN_PRODUCTS },
  { label: "Add Products", icon: PlusCircle, path: FRONTEND_ROUTES.ADMIN_ADD_PRODUCTS },
  { label: "Orders", icon: ShoppingBag, path: FRONTEND_ROUTES.ADMIN_ORDERS, badge: "pendingReturns" },
  { label: "Returns", icon: RotateCcw, path: FRONTEND_ROUTES.ADMIN_RETURNS },
  { label: "Sales Reports", icon: BarChart2, path: FRONTEND_ROUTES.ADMIN_SALES_REPORTS },
  { label: "Earnings", icon: Wallet, path: FRONTEND_ROUTES.ADMIN_EARNINGS },
];

const AdminSidebar = ({ isSidebarOpen }) => {
  const location = useLocation();
  // Pending return requests, shown as a badge on Orders
  const { data: statsData } = useGetAdminOrderStats();
  const badges = { pendingReturns: statsData?.data?.pendingReturns || 0 };

  return (
    <aside className={`bg-slate-900 text-slate-300 w-64 flex-shrink-0 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full absolute h-full z-20'}`}>
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <Link to={FRONTEND_ROUTES.ADMIN_DASHBOARD} className="flex items-center gap-2 no-underline">
          <img src="/logo.webp" alt="Care N Safe" className="h-6 object-contain brightness-0 invert" />
          <span className="text-white font-bold text-[14px]">Admin Portal</span>
        </Link>
      </div>

      <nav className="flex-1 py-6 px-4 flex flex-col gap-1.5">
        {NAV_ITEMS.map(({ label, icon: Icon, path, badge }) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <Link
              key={label}
              to={path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold no-underline transition-colors
                ${isActive
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-slate-800 hover:text-white'
                }`}
            >
              <Icon size={16} className={isActive ? 'text-indigo-200' : 'text-slate-400'} />
              {label}
              {badge && badges[badge] > 0 && (
                <span
                  className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-slate-900"
                  aria-label={`${badges[badge]} pending return requests`}
                >
                  {badges[badge]}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
