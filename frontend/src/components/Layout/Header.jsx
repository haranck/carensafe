import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import { clearAccessToken } from "../../store/slices/tokenSlice";
import { clearAuth } from "../../store/slices/authSlice";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { CONTAINER } from "../../constants/customerTheme";
import AnnouncementBar from "./HeaderParts/AnnouncementBar";
import NavLinks from "./HeaderParts/NavLinks";
import HeaderActions from "./HeaderParts/HeaderActions";
import SearchPanel from "./HeaderParts/SearchPanel";
import MobileDrawer from "./HeaderParts/MobileDrawer";
import { FOCUS_RING } from "./HeaderParts/navConfig";

const SEARCH_ID = "header-search";
const DRAWER_ID = "header-mobile-drawer";

export const Header = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const accessToken = useSelector((s) => s.token.accessToken);
  const user = useSelector((s) => s.auth.user);
  const isLoggedIn = Boolean(accessToken);

  const [isScrolled, setIsScrolled] = useState(false);
  const isScrolledRef = useRef(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Close overlays on route change (state adjusted during render, no effect needed)
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsSearchOpen(false);
    setIsDrawerOpen(false);
  }

  // Only re-render when crossing the threshold, not on every scroll pixel
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 10;
      if (scrolled !== isScrolledRef.current) {
        isScrolledRef.current = scrolled;
        setIsScrolled(scrolled);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const handleLogout = () => {
    dispatch(clearAccessToken());
    dispatch(clearAuth());
    navigate(FRONTEND_ROUTES.LOGIN);
  };

  return (
    <LazyMotion features={domAnimation} strict>
      <AnnouncementBar />

      {/* Floating capsule: 1px gradient border wrapper around a frosted white body */}
      <header className="sticky top-3 z-[100] mt-3">
        <div className={CONTAINER}>
          <div className="relative">
            <div
              className={`rounded-[22px] bg-gradient-to-r from-violet-200/80 via-pink-200/80 to-violet-200/80 p-px transition-shadow duration-300 ${
                isScrolled
                  ? "shadow-[0_16px_40px_-18px_rgba(59,42,138,0.4)]"
                  : "shadow-[0_10px_30px_-22px_rgba(59,42,138,0.3)]"
              }`}
            >
              <div
                className={`flex h-16 items-center justify-between gap-4 rounded-[21px] px-4 backdrop-blur-md transition-colors duration-300 lg:px-5 ${
                  isScrolled ? "bg-white/95" : "bg-white/80"
                }`}
              >
                <Link
                  to={isLoggedIn ? FRONTEND_ROUTES.HOME : FRONTEND_ROUTES.LANDING}
                  aria-label="Care N Safe home"
                  className={`flex-shrink-0 rounded-lg ${FOCUS_RING}`}
                >
                  <img src="/logo.webp" alt="Care N Safe" width={62} height={40} className="h-10 w-[62px] object-contain" />
                </Link>

                <NavLinks isLoggedIn={isLoggedIn} />

                <HeaderActions
                  isLoggedIn={isLoggedIn}
                  user={user}
                  isSearchOpen={isSearchOpen}
                  searchId={SEARCH_ID}
                  onToggleSearch={() => setIsSearchOpen((open) => !open)}
                  isDrawerOpen={isDrawerOpen}
                  drawerId={DRAWER_ID}
                  onOpenDrawer={() => setIsDrawerOpen(true)}
                  onLogout={handleLogout}
                />
              </div>
            </div>

            <AnimatePresence>
              {isSearchOpen && <SearchPanel key="search" id={SEARCH_ID} onClose={closeSearch} />}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Rendered outside <header>: the capsule's backdrop-blur would otherwise trap position:fixed */}
      <AnimatePresence>
        {isDrawerOpen && (
          <MobileDrawer
            key="drawer"
            id={DRAWER_ID}
            isLoggedIn={isLoggedIn}
            user={user}
            onClose={closeDrawer}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>
    </LazyMotion>
  );
};

export default Header;
