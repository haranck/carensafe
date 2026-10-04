import { NavLink } from "react-router-dom";
import { LayoutDashboard, LogOut, MapPin, Package, User, Wallet } from "lucide-react";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { FOCUS_RING } from "../../constants/customerTheme";

const TABS = [
  { label: "Dashboard", icon: LayoutDashboard, to: FRONTEND_ROUTES.PROFILE, end: true },
  { label: "My Profile", icon: User, to: FRONTEND_ROUTES.PROFILE_EDIT },
  { label: "My Orders", icon: Package, to: FRONTEND_ROUTES.ORDERS },
  { label: "My Addresses", icon: MapPin, to: FRONTEND_ROUTES.PROFILE_ADDRESSES },
  { label: "Wallet", icon: Wallet, to: FRONTEND_ROUTES.WALLET },
];

// Full class strings per variant and state
const STYLES = {
  sidebar: {
    list: "flex flex-col gap-1",
    link: `relative flex h-11 items-center gap-3 rounded-xl px-4 text-[14px] transition-colors ${FOCUS_RING}`,
    active:
      "bg-[#fff5fa] font-bold text-[#d6008a] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#d6008a] before:to-[#7c3aed]",
    idle: "font-medium text-slate-600 hover:bg-slate-50 hover:text-[#1e1a3a]",
    logout: `flex h-11 w-full items-center gap-3 rounded-xl px-4 text-[14px] font-semibold text-rose-500 hover:bg-rose-50 transition-colors ${FOCUS_RING}`,
  },
  pills: {
    list: "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
    link: `inline-flex h-10 flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-[13px] transition-colors ${FOCUS_RING}`,
    active: "border-pink-200 bg-[#fff5fa] font-bold text-[#d6008a]",
    idle: "border-slate-200 bg-white font-medium text-slate-600 hover:border-pink-200 hover:text-[#d6008a]",
    logout: `inline-flex h-10 flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-rose-100 bg-white px-4 text-[13px] font-semibold text-rose-500 hover:bg-rose-50 transition-colors ${FOCUS_RING}`,
  },
};

/**
 * Profile tabs: "sidebar" (desktop card, gradient bar on the active tab) or "pills" (mobile, scrolls sideways).
 * Logout is a button: it opens the confirm dialog owned by the layout.
 */
const ProfileNav = ({ variant = "sidebar", onLogout }) => {
  const styles = STYLES[variant];

  return (
    <nav aria-label="Account">
      <ul className={styles.list}>
        {TABS.map(({ label, icon: Icon, to, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} className={({ isActive }) => `${styles.link} ${isActive ? styles.active : styles.idle}`}>
              <Icon size={variant === "sidebar" ? 18 : 16} aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
        <li>
          <button type="button" onClick={onLogout} className={styles.logout}>
            <LogOut size={variant === "sidebar" ? 18 : 16} aria-hidden="true" />
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default ProfileNav;
