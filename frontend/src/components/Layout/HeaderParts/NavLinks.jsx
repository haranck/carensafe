import { NavLink } from "react-router-dom";
import { NAV_LINKS, FOCUS_RING, resolveNavPath } from "./navConfig";

const NavLinks = ({ isLoggedIn }) => (
  <nav aria-label="Main" className="hidden lg:block">
    <ul className="flex items-center gap-0.5">
      {NAV_LINKS.map((link) => (
        <li key={link.label}>
          <NavLink
            to={resolveNavPath(link, isLoggedIn)}
            end
            className={({ isActive }) =>
              `inline-flex h-10 items-center rounded-full px-2.5 xl:px-3 text-[13.5px] whitespace-nowrap transition-colors duration-200 ${FOCUS_RING} ${
                isActive
                  ? "bg-[#fff0f7] font-semibold text-[#d6008a] shadow-[inset_0_0_0_1px_rgba(214,0,138,0.12)]"
                  : "font-medium text-slate-600 hover:bg-violet-50/80 hover:text-[#3b2a8a]"
              }`
            }
          >
            {link.label}
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
);

export default NavLinks;
