import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { LogOut, ChevronDown } from "lucide-react";

const AdminHeader = ({ isSidebarOpen, setIsSidebarOpen, handleLogout }) => {
  const admin = useSelector((state) => state.adminSession?.user);
  const adminName = [admin?.firstName, admin?.lastName].filter(Boolean).join(" ") || "Admin";
  const initial = adminName[0].toUpperCase();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 relative z-30">
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

      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 focus:outline-none bg-transparent border-none cursor-pointer p-1 rounded-full hover:bg-slate-50 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[12px]">
            {initial}
          </div>
          <ChevronDown size={14} className="text-slate-500" />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-slate-100 py-1.5 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-50">
              <p className="text-[13px] font-semibold text-slate-700 truncate">
                {adminName}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {admin?.email}
              </p>
            </div>
            
            <button 
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-rose-500 hover:bg-rose-50 flex items-center gap-2 transition-colors bg-transparent border-none cursor-pointer"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;
