import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Truck, ShieldCheck, Heart, ShoppingBag, Search, User, LogOut, ChevronDown, Wallet } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { clearAccessToken } from "../../store/slices/tokenSlice";
import { clearAuth } from "../../store/slices/authSlice";

const NAV_LINKS = [
  { label: "Home",              to: "/" },
  { label: "Shop",              to: "/shop" },
  { label: "Technology & Care", to: "/technology" },
  { label: "Care Shorts",       to: "/care-shorts" },
  { label: "About Us",          to: "/about" },
  { label: "Contact",           to: "/contact" },
];

export const Header = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((s) => s.auth.user);
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const close = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleLogout = () => {
    dispatch(clearAccessToken());
    dispatch(clearAuth());
    setDropdownOpen(false);
    navigate("/login");
  };

  const initial = user?.firstName?.[0]?.toUpperCase() || "U";

  return (
    <header className="w-full bg-white sticky top-0 z-[100]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Top bar ── */}
      <div
        className="text-white/90 text-[10px] font-medium tracking-wide py-[5px] px-4"
        style={{ background: "linear-gradient(90deg,#1e1a3a 0%,#3b2a8a 50%,#d6008a 100%)" }}
      >
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <span className="flex items-center gap-1"><Truck size={10} /> Free Delivery Above ₹399</span>
          <span className="text-white/30 hidden sm:inline">|</span>
          <span className="hidden sm:flex items-center gap-1"><ShieldCheck size={10} /> NABL Certified</span>
          <span className="text-white/30 hidden md:inline">|</span>
          <span className="hidden md:flex items-center gap-1"><Heart size={10} /> 25 Lakh+ Happy Women</span>
          <span className="text-white/30 hidden lg:inline">|</span>
          <span className="hidden lg:flex items-center gap-1">100% Organic Cotton</span>
        </div>
      </div>

      {/* ── Main nav ── */}
      <div className="border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-5 h-[52px] flex items-center justify-between gap-5">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img src="/logo.webp" alt="Care N Safe" className="h-[36px] w-auto object-contain" />
          </Link>

          {/* Nav links */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ label, to }) => {
              // Make Home point to /home if authenticated to match the routes
              const targetRoute = (label === "Home" && isAuthenticated) ? "/home" : to;
              // Highlight Home if we are on / or /home
              const active = pathname === targetRoute || (label === "Home" && pathname === "/");
              
              return (
                <Link
                  key={label}
                  to={targetRoute}
                  className={`text-[13px] px-3 py-1.5 rounded-md no-underline transition-colors duration-150
                    ${active
                      ? "text-[#1a56db] font-semibold bg-blue-50/70"
                      : "text-gray-600 font-normal hover:text-[#1a56db] hover:bg-gray-50"
                    }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-1">

            {/* Search */}
            <button className="p-2 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors duration-150 border-none bg-transparent cursor-pointer" aria-label="Search">
              <Search size={18} strokeWidth={1.8} />
            </button>

            {/* Wishlist */}
            <button className="p-2 rounded-md text-gray-500 hover:text-rose-500 hover:bg-rose-50/60 transition-colors duration-150 border-none bg-transparent cursor-pointer" aria-label="Wishlist">
              <Heart size={18} strokeWidth={1.8} />
            </button>

            {/* Cart */}
            <Link to="#" className="p-2 rounded-md text-gray-500 hover:text-violet-600 hover:bg-violet-50/60 transition-colors duration-150 no-underline" aria-label="Cart">
              <ShoppingBag size={18} strokeWidth={1.8} />
            </Link>

            {/* Wallet */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-gray-500 hover:bg-gray-50 transition-colors duration-150 cursor-pointer">
              <Wallet size={16} strokeWidth={1.8} />
              <span className="text-[12px] font-semibold text-gray-700">₹0</span>
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Auth: Profile or Login */}
            {isAuthenticated && user ? (
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors duration-150 border-none bg-transparent cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3b2a8a] to-[#d6008a] flex items-center justify-center text-white text-[11px] font-semibold">
                    {initial}
                  </div>
                  <span className="text-[12.5px] font-medium text-gray-700 hidden sm:inline max-w-[80px] truncate">
                    {user.firstName}
                  </span>
                  <ChevronDown size={13} className={`text-gray-400 transition-transform duration-150 ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-48 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-50">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-[12.5px] font-semibold text-gray-800 truncate">{user.firstName} {user.lastName}</p>
                      <p className="text-[10.5px] text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-[12.5px] text-gray-600 hover:bg-gray-50 no-underline transition-colors">
                      <User size={14} /> Profile
                    </Link>
                    <Link to="#" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 text-[12.5px] text-gray-600 hover:bg-gray-50 no-underline transition-colors">
                      <ShoppingBag size={14} /> Orders
                    </Link>
                    <div className="border-t border-gray-100">
                      <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-[12.5px] text-rose-500 hover:bg-rose-50 border-none bg-transparent cursor-pointer transition-colors">
                        <LogOut size={14} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-[7px] rounded-md no-underline text-[12.5px] font-semibold text-white bg-[#1a56db] hover:bg-[#1648b8] transition-colors duration-150"
              >
                <User size={14} strokeWidth={2} />
                Login
              </Link>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
