import { useSelector } from "react-redux";

const AdminHeader = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const user = useSelector((state) => state.auth.user);
  const initial = user?.firstName?.[0]?.toUpperCase() || "A";

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-slate-500 hover:text-indigo-600 focus:outline-none bg-transparent border-none cursor-pointer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <span className="text-[13px] font-semibold text-slate-500">Command Center</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[12px]">
          {initial}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
