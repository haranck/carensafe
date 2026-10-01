import AdminLoginForm from "../../../components/Admin/Auth/AdminLoginForm";
import { ShieldCheck, Lock, Activity, Users } from "lucide-react";

const ADMIN_FEATURES = [
  { icon: ShieldCheck, label: "Advanced Security Controls" },
  { icon: Activity, label: "Real-time Analytics" },
  { icon: Users, label: "User Management" },
];

const AdminLoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 font-sans p-6 overflow-hidden relative">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-20 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-0 transform translate-x-1/3 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 left-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[1000px] flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        
        {/* Left Side: Admin Branding */}
        <div className="flex-1 text-center lg:text-left text-white">
          <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/50 rounded-full px-4 py-1.5 mb-6 backdrop-blur-md">
            <Lock size={14} className="text-indigo-400" />
            <span className="text-[11px] font-bold text-indigo-300 tracking-widest uppercase">
              Authorized Personnel Only
            </span>
          </div>

          <h1 className="text-[40px] lg:text-[52px] font-black text-white leading-[1.1] tracking-tight mb-6">
            Care N Safe
            <br />
            <span className="text-indigo-400">Admin Command Center</span>
          </h1>

          <p className="text-[16px] text-slate-400 leading-relaxed mb-10 max-w-[400px] mx-auto lg:mx-0">
            Secure access to the Care N Safe management portal. Monitor performance, manage users, and oversee operations.
          </p>

          <div className="flex flex-col gap-4 max-w-[360px] mx-auto lg:mx-0 hidden md:flex">
            {ADMIN_FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-4 bg-slate-800/40 border border-slate-700/30 rounded-2xl p-4 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-indigo-400" />
                </div>
                <span className="text-[14px] font-semibold text-slate-200">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: The Form */}
        <div className="w-full max-w-[460px]">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
