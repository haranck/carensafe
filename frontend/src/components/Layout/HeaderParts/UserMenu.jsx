import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, m } from "framer-motion";
import { ChevronDown, LogOut } from "lucide-react";
import { ACCOUNT_LINKS, FOCUS_RING } from "./navConfig";
import UserAvatar from "../../common/UserAvatar";

const UserMenu = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuId = useId();

  const firstName = user?.firstName || "Account";
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "My Account";

  useEffect(() => {
    if (!isOpen) return;
    const handlePointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setIsOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  const close = () => setIsOpen(false);

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={`Account menu for ${firstName}`}
        className={`flex items-center gap-2 h-10 pl-1 pr-2.5 rounded-full hover:bg-violet-50 transition-colors duration-200 ${FOCUS_RING}`}
      >
        <UserAvatar user={user} className="w-8 h-8 text-[12px]" />
        <span className="hidden xl:inline max-w-[88px] truncate text-[13.5px] font-semibold text-[#1e1a3a]">{firstName}</span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <m.div
            id={menuId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white border border-violet-100 shadow-[0_16px_40px_-12px_rgba(59,42,138,0.25)] p-2 z-50"
          >
            <div className="px-3 py-2.5 mb-1 rounded-xl bg-gradient-to-br from-violet-50 to-pink-50">
              <p className="text-[13.5px] font-bold text-[#1e1a3a] truncate">{fullName}</p>
              {user?.email && <p className="text-[12px] text-slate-500 truncate">{user.email}</p>}
            </div>

            <ul>
              {ACCOUNT_LINKS.map(({ label, icon: Icon, to, meta }) => (
                <li key={label}>
                  <Link
                    to={to}
                    onClick={close}
                    className={`flex items-center gap-3 h-10 px-3 rounded-xl text-[13.5px] font-medium text-slate-600 hover:bg-violet-50 hover:text-[#1e1a3a] transition-colors ${FOCUS_RING}`}
                  >
                    <Icon size={16} aria-hidden="true" className="text-[#7c3aed]" />
                    <span className="flex-1">{label}</span>
                    {meta && <span className="text-[12px] font-bold text-[#d6008a]">{meta}</span>}
                  </Link>
                </li>
              ))}
            </ul>

            <div role="separator" className="my-1.5 h-px bg-slate-100" />

            <button
              type="button"
              onClick={() => {
                close();
                onLogout();
              }}
              className={`flex w-full items-center gap-3 h-10 px-3 rounded-xl text-[13.5px] font-semibold text-rose-500 hover:bg-rose-50 transition-colors ${FOCUS_RING}`}
            >
              <LogOut size={16} aria-hidden="true" />
              Logout
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;
