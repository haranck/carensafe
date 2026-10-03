import { useSelector } from "react-redux";
import { Users, Activity, IndianRupee, ShoppingCart, TrendingUp } from "lucide-react";

const STATS = [
  { label: "Total Revenue", value: "₹24,56,800", icon: IndianRupee, change: "+12.5%", positive: true },
  { label: "Total Orders", value: "3,456", icon: ShoppingCart, change: "+8.2%", positive: true },
  { label: "Active Users", value: "12,450", icon: Users, change: "+18.1%", positive: true },
  { label: "Conversion Rate", value: "4.2%", icon: Activity, change: "-1.1%", positive: false },
];

const AdminDashboardPage = () => {
  const user = useSelector((state) => state.auth.user);

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-black text-slate-800 mb-1">
          Dashboard Overview
        </h1>
        <p className="text-slate-500 text-[14px]">
          Welcome back, <span className="font-semibold text-slate-700">{user?.firstName || 'Admin'}</span>. Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {STATS.map(({ label, value, icon: Icon, change, positive }) => (
          <div key={label} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                <Icon size={18} className="text-indigo-600" />
              </div>
              <div className={`flex items-center gap-1 text-[12px] font-bold px-2 py-1 rounded-full ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {positive ? <TrendingUp size={12} /> : <Activity size={12} />}
                {change}
              </div>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-500 mb-1">{label}</p>
              <p className="text-[24px] font-black text-slate-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Orders - Takes up 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-slate-800">Recent Orders</h2>
            <button className="text-[13px] font-semibold text-indigo-600 hover:text-indigo-700 bg-transparent border-none cursor-pointer">
              View All
            </button>
          </div>
          <div className="p-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold border-b border-slate-100">Order ID</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-100">Customer</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-100">Status</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-100">Total</th>
                </tr>
              </thead>
              <tbody className="text-[13px] font-medium text-slate-700">
                {[
                  { id: "#ORD-7829", customer: "Priya Sharma", status: "Delivered", statusColor: "emerald", total: "₹1,249" },
                  { id: "#ORD-7828", customer: "Anjali Menon", status: "Processing", statusColor: "amber", total: "₹899" },
                  { id: "#ORD-7827", customer: "Sneha Reddy", status: "Shipped", statusColor: "blue", total: "₹2,150" },
                  { id: "#ORD-7826", customer: "Kavya Patel", status: "Cancelled", statusColor: "rose", total: "₹499" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 border-b border-slate-50 font-bold text-slate-800">{row.id}</td>
                    <td className="px-6 py-4 border-b border-slate-50">{row.customer}</td>
                    <td className="px-6 py-4 border-b border-slate-50">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold bg-${row.statusColor}-50 text-${row.statusColor}-600`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-b border-slate-50">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions / Notifications */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-[16px] font-bold text-slate-800">Quick Actions</h2>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <button className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer bg-white text-left group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                  <ShoppingCart size={14} className="text-slate-500 group-hover:text-indigo-600" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-800">Add New Product</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Update your inventory</p>
                </div>
              </div>
            </button>
            <button className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer bg-white text-left group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                  <Users size={14} className="text-slate-500 group-hover:text-indigo-600" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-800">Manage Users</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">View and edit user roles</p>
                </div>
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboardPage;
