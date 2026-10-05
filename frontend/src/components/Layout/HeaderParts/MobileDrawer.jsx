import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { m } from "framer-motion";
import { X, Search, LogOut } from "lucide-react";
import { FRONTEND_ROUTES } from "../../../constants/frontendRoutes";
import {
  NAV_LINKS,
  ACCOUNT_LINKS,
  INFO_LINKS,
  BRAND_GRADIENT,
  FOCUS_RING,
  resolveNavPath,
} from "./navConfig";
import UserAvatar from "../../common/UserAvatar";
import { useWalletBalance } from "../../../hooks/Wallet/WalletHooks";
import { formatPaise } from "../../../utils/wallet";

// The footer's info / help links (phones don't show the footer), minus the ones Explore already lists (About Us)
const DRAWER_INFO_LINKS = INFO_LINKS.filter((info) => !NAV_LINKS.some((link) => link.label === info.label));

const SectionTitle = ({ children }) => (
  <p className="px-3 mb-1.5 text-[10.5px] font-bold uppercase tracking-widest text-slate-400">{children}</p>
);

const MobileDrawer = ({ id, isLoggedIn, user, onClose, onLogout }) => {
  const { data: walletBalance } = useWalletBalance();
  const [query, setQuery] = useState("");
  const closeButtonRef = useRef(null);
  const navigate = useNavigate();

  // Lock body scroll, move focus into the drawer, close on Escape, restore focus on close
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const handleSearch = (e) => {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;
    onClose();
    navigate({ pathname: FRONTEND_ROUTES.SHOP, search: `?${new URLSearchParams({ search: term })}` });
  };

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "My Account";
  const linkClass = `flex items-center gap-3 h-11 px-3 rounded-xl text-[14.5px] transition-colors ${FOCUS_RING}`;

  return (
    <>
      <m.div
        aria-hidden="true"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[150] bg-[#1e1a3a]/40 backdrop-blur-sm lg:hidden"
      />

      <m.aside
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
        className="fixed inset-y-0 right-0 z-[160] w-[86%] max-w-[360px] bg-[#fdfbff] shadow-2xl flex flex-col lg:hidden"
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-violet-100 bg-white">
          <img src="/logo.webp" alt="Care N Safe" width={62} height={40} className="h-10 w-[62px] object-contain" />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-slate-500 hover:text-[#d6008a] hover:bg-pink-50 transition-colors ${FOCUS_RING}`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-6">
          <form role="search" onSubmit={handleSearch}>
            <label htmlFor={`${id}-search`} className="sr-only">
              Search products
            </label>
            <div className="flex items-center gap-2.5 h-11 px-4 rounded-full border border-slate-200 bg-white focus-within:border-[#d6008a] focus-within:shadow-[0_0_0_3px_rgba(214,0,138,0.12)] transition-all">
              <Search size={17} aria-hidden="true" className="text-slate-400 flex-shrink-0" />
              <input
                id={`${id}-search`}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
                className="flex-1 min-w-0 bg-transparent outline-none text-[14px] text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </form>

          {isLoggedIn && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-100">
              <UserAvatar user={user} className="w-11 h-11 text-[14px]" />
              <div className="min-w-0">
                <p className="text-[14.5px] font-bold text-[#1e1a3a] truncate">{fullName}</p>
                {user?.email && <p className="text-[12px] text-slate-500 truncate">{user.email}</p>}
              </div>
            </div>
          )}

          <nav aria-label="Mobile">
            <SectionTitle>Explore</SectionTitle>
            <ul className="flex flex-col gap-0.5">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <NavLink
                    to={resolveNavPath(link, isLoggedIn)}
                    end
                    onClick={onClose}
                    className={({ isActive }) =>
                      `${linkClass} ${
                        isActive
                          ? "bg-white text-[#d6008a] font-semibold shadow-sm border border-pink-100"
                          : "text-slate-600 font-medium hover:bg-white hover:text-[#7c3aed]"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {isLoggedIn && (
            <div>
              <SectionTitle>My Account</SectionTitle>
              <ul className="flex flex-col gap-0.5">
                {ACCOUNT_LINKS.map(({ label, icon: Icon, to, showsWalletBalance }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      onClick={onClose}
                      className={`${linkClass} font-medium text-slate-600 hover:bg-white hover:text-[#1e1a3a]`}
                    >
                      <Icon size={17} aria-hidden="true" className="text-[#7c3aed]" />
                      <span className="flex-1">{label}</span>
                      {showsWalletBalance && walletBalance !== undefined && (
                      <span className="text-[13px] font-bold text-[#d6008a]">{formatPaise(walletBalance)}</span>
                    )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {DRAWER_INFO_LINKS.length > 0 && (
            <nav aria-label="Info">
              <SectionTitle>Info</SectionTitle>
              <ul className="flex flex-col gap-0.5">
                {DRAWER_INFO_LINKS.map(({ label, icon: Icon, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      onClick={onClose}
                      className={`${linkClass} font-medium text-slate-600 hover:bg-white hover:text-[#1e1a3a]`}
                    >
                      <Icon size={17} aria-hidden="true" className="text-[#7c3aed]" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>

        {/* Bottom bar: Logout for members, Login / Sign Up for guests */}
        <div className="p-4 border-t border-violet-100 bg-white">
          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className={`flex w-full items-center justify-center gap-2 h-11 rounded-full text-[14px] font-semibold text-rose-500 bg-rose-50 hover:bg-rose-100 transition-colors ${FOCUS_RING}`}
            >
              <LogOut size={16} aria-hidden="true" />
              Logout
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to={FRONTEND_ROUTES.LOGIN}
                onClick={onClose}
                className={`flex items-center justify-center h-11 rounded-full border border-slate-200 bg-white text-[14px] font-semibold text-[#1e1a3a] hover:border-[#d6008a] hover:text-[#d6008a] transition-colors ${FOCUS_RING}`}
              >
                Login
              </Link>
              <Link
                to={FRONTEND_ROUTES.SIGNUP}
                onClick={onClose}
                className={`flex items-center justify-center h-11 rounded-full text-[14px] font-bold text-white ${BRAND_GRADIENT} shadow-[0_4px_14px_rgba(214,0,138,0.25)] ${FOCUS_RING}`}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </m.aside>
    </>
  );
};

export default MobileDrawer;
