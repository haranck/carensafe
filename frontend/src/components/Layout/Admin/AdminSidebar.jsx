import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, ShoppingCart, Activity, Settings, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "Users", icon: Users, path: "/admin/users" },
  { label: "Orders", icon: ShoppingCart, path: "/admin/orders" },
  { label: "Analytics", icon: Activity, path: "/admin/analytics" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
];

const AdminSidebar = ({ isSidebarOpen, handleLogout }) => {
  const location = useLocation();

  return (
    <aside className={`bg-slate-900 text-slate-300 w-64 flex-shrink-0 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full absolute h-full z-20'}`}>
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <Link to="/admin/dashboard" className="flex items-center gap-2 no-underline">
          <img src="/logo.webp" alt="Care N Safe" className="h-6 object-contain brightness-0 invert" />
          <span className="text-white font-bold text-[14px]">Admin Portal</span>
        </Link>
      </div>

      <nav className="flex-1 py-6 px-4 flex flex-col gap-1.5">
        {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
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
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-rose-400 hover:bg-rose-400/10 hover:text-rose-300 transition-colors bg-transparent border-none cursor-pointer"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
