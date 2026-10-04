import { Suspense, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import { Loader2 } from "lucide-react";
import Header from "../../components/Layout/Header";
import Footer from "../../components/Layout/Footer";
import UserAvatar from "../../components/common/UserAvatar";
import LogoutDialog from "../../components/common/LogoutDialog";
import ProfileNav from "../../components/Profile/ProfileNav";
import { CONTAINER, PAGE_BACKGROUND } from "../../constants/customerTheme";

const CARD = "rounded-2xl border border-slate-100 bg-white shadow-[0_4px_18px_-12px_rgba(59,42,138,0.18)]";

// Avatar, name, email from the Redux user (refreshed after every profile change)
const Identity = ({ user }) => {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "My Account";
  return (
    <div className="flex min-w-0 items-center gap-3">
      <UserAvatar user={user} className="h-14 w-14 text-[18px]" />
      <div className="min-w-0">
        <p className="truncate text-[15px] font-extrabold text-[#1e1a3a]">{fullName}</p>
        {user?.email && <p className="truncate text-[12.5px] text-slate-500">{user.email}</p>}
      </div>
    </div>
  );
};

const TabLoader = () => (
  <div role="status" className="flex min-h-[320px] items-center justify-center">
    <Loader2 size={28} aria-hidden="true" className="animate-spin text-[#d6008a]" />
    <span className="sr-only">Loading…</span>
  </div>
);

// /profile/*: sidebar (desktop) or header card + tab pills (mobile), the active tab on the right
const ProfileLayout = () => {
  const user = useSelector((s) => s.auth.user);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const openLogout = () => setIsLogoutOpen(true);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "My Account | Care N Safe";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className={`min-h-screen flex flex-col font-sans ${PAGE_BACKGROUND}`}>
      <Header />

      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <main className="flex-1 overflow-x-clip">
            <div className={`${CONTAINER} pt-8 pb-16`}>
              <div className="mx-auto grid max-w-[1240px] gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
                <aside className={`hidden p-4 lg:sticky lg:top-28 lg:block ${CARD}`}>
                  <div className="border-b border-slate-100 px-2 pb-4 pt-1">
                    <Identity user={user} />
                  </div>
                  <div className="pt-3">
                    <ProfileNav variant="sidebar" onLogout={openLogout} />
                  </div>
                </aside>

                <div className="flex min-w-0 flex-col gap-4 lg:hidden">
                  <div className={`p-4 ${CARD}`}>
                    <Identity user={user} />
                  </div>
                  <ProfileNav variant="pills" onLogout={openLogout} />
                </div>

                <div className="min-w-0">
                  <Suspense fallback={<TabLoader />}>
                    <Outlet />
                  </Suspense>
                </div>
              </div>
            </div>
          </main>
        </MotionConfig>
      </LazyMotion>

      <Footer />
      <LogoutDialog open={isLogoutOpen} onClose={() => setIsLogoutOpen(false)} />
    </div>
  );
};

export default ProfileLayout;
