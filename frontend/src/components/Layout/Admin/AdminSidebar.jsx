import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Package, ShoppingBag, BarChart2, Wallet, PlusCircle } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "User Management", icon: Users, path: "/admin/users" },
  { label: "Products", icon: Package, path: "/admin/products" },
  { label: "Add Products", icon: PlusCircle, path: "/admin/add-products" },
  { label: "Orders", icon: ShoppingBag, path: "/admin/orders" },
  { label: "Sales Reports", icon: BarChart2, path: "/admin/sales-reports" },
  { label: "Earnings", icon: Wallet, path: "/admin/earnings" },
];

const AdminSidebar = ({ isSidebarOpen }) => {
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
    </aside>
  );
};

export default AdminSidebar;
