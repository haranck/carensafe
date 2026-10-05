import { useId } from "react";
import { Link, useLocation } from "react-router-dom";
import { LazyMotion, MotionConfig, domAnimation, m } from "framer-motion";
import { ArrowRight, CreditCard, Gift, Sparkles } from "lucide-react";
import Header from "../../components/Layout/Header";
import Footer from "../../components/Layout/Footer";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { CONTAINER, FOCUS_RING, PAGE_BACKGROUND, PINK_BUTTON } from "../../constants/customerTheme";
import { usePageTitle } from "../../hooks/common/usePageTitle";

// Account pages that are linked from the header but not built yet (all behind ProtectedRoute)
const PAGES = {
  [FRONTEND_ROUTES.CHECKOUT]: { title: "Checkout", icon: CreditCard },
  [FRONTEND_ROUTES.REWARDS]: { title: "Rewards", icon: Gift },
};
const FALLBACK = { title: "This page", icon: Sparkles };

// Placeholder for the routes in PAGES, so their links never open a blank page
const ComingSoonPage = () => {
  const headingId = useId();
  const { pathname } = useLocation();
  const { title, icon: Icon } = PAGES[pathname] || FALLBACK;

  usePageTitle(title);

  return (
    <div className={`min-h-screen flex flex-col font-sans ${PAGE_BACKGROUND}`}>
      <Header />

      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <main className={`flex-1 ${CONTAINER} py-12 sm:py-16`}>
            <m.section
              aria-labelledby={headingId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mx-auto flex max-w-[560px] flex-col items-center rounded-2xl border border-pink-100 bg-white px-6 py-12 text-center shadow-[0_4px_18px_-12px_rgba(59,42,138,0.18)] sm:px-10"
            >
              <span className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#fff5fa] text-[#d6008a]">
                <Icon size={34} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="inline-flex items-center rounded-full border border-pink-100 bg-white px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#d6008a]">
                Coming Soon
              </span>
              <h1
                id={headingId}
                className="mt-3 text-[26px] font-extrabold leading-tight tracking-tight text-[#1e1a3a] sm:text-[32px]"
              >
                {title} is <span className="font-accent font-medium italic text-[#d6008a]">almost here</span>
              </h1>
              <p className="mt-2 max-w-[400px] text-[14px] leading-relaxed text-slate-500">
                We're putting the finishing touches on this page. In the meantime, explore our organic range.
              </p>
              <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
                <Link
                  to={FRONTEND_ROUTES.SHOP}
                  className={`inline-flex h-11 items-center gap-2 rounded-full px-6 text-[14px] font-bold ${PINK_BUTTON} ${FOCUS_RING}`}
                >
                  Continue Shopping <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link
                  to={FRONTEND_ROUTES.HOME}
                  className={`inline-flex h-11 items-center rounded-full border border-pink-200 bg-white px-5 text-[14px] font-bold text-[#d6008a] hover:bg-[#fff5fa] hover:text-[#9d0063] transition-colors ${FOCUS_RING}`}
                >
                  Back to Home
                </Link>
              </div>
            </m.section>
          </main>
        </MotionConfig>
      </LazyMotion>

      <Footer />
    </div>
  );
};

export default ComingSoonPage;
