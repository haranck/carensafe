import { Link } from "react-router-dom";
import { ArrowRight, LogIn, Star } from "lucide-react";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { BRAND_GRADIENT, CONTAINER, FOCUS_RING } from "../../constants/customerTheme";

// "Care for Today, A Safer Tomorrow" campaign banner (public/banners/, WebP made from the original PNG).
// The headline and benefits are part of the artwork, so the alt text repeats them for screen readers.
const BANNER_WIDTHS = [800, 1280, 2100];
const BANNER_SRC_SET = BANNER_WIDTHS.map((width) => `/banners/hero-confident-every-day-${width}.webp ${width}w`).join(", ");
const BANNER_ALT =
  "Care N Safe premium sanitary napkins. Care for today, a safer tomorrow. Comfort, protection and confidence every day: leak protection, soft and comfortable, skin friendly, high absorbency.";

/**
 * Home hero: the full campaign banner (links to the shop), then a strip with the call to action.
 * Guest ("/"): Shop Now + Login / Sign Up. Member ("/home"): "Welcome back, <firstName>" + Shop Now.
 */
const HomeHero = ({ firstName, isGuest = false }) => (
  <section aria-labelledby="home-hero-title" className={`${CONTAINER} pt-6 sm:pt-8`}>
    <h1 id="home-hero-title" className="sr-only">
      Care N Safe: care for today, a safer tomorrow
    </h1>

    <div className="overflow-hidden rounded-[1.25rem] border border-pink-100 bg-white shadow-[0_18px_44px_-24px_rgba(59,42,138,0.45)] sm:rounded-[1.75rem]">
      <Link
        to={FRONTEND_ROUTES.SHOP}
        aria-label="Shop Care N Safe premium sanitary napkins"
        className="group block overflow-hidden focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#d6008a]/40"
      >
        <img
          src="/banners/hero-confident-every-day-1280.webp"
          srcSet={BANNER_SRC_SET}
          sizes="(min-width: 1600px) 1536px, calc(100vw - 32px)"
          width={2100}
          height={747}
          alt={BANNER_ALT}
          fetchPriority="high"
          decoding="async"
          className="block h-auto w-full transition-transform duration-500 ease-out group-hover:scale-[1.015] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </Link>

      <div className="flex flex-col gap-3 border-t border-pink-100 bg-gradient-to-r from-[#fff5fa] via-white to-[#f5effd] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5">
        <div className="min-w-0">
          {isGuest ? (
            <p className="text-[15px] font-extrabold text-[#1e1a3a] sm:text-[17px]">
              Organic cotton pads made for <span className="font-accent font-medium italic text-[#d6008a]">every day</span>
            </p>
          ) : (
            <p className="text-[15px] font-extrabold text-[#1e1a3a] sm:text-[17px]">
              Welcome back, {firstName || "there"} <span aria-hidden="true">👋</span>
            </p>
          )}
          <p className="mt-1 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500">
            <Star size={14} aria-hidden="true" className="fill-amber-400 text-amber-400" />
            4.9 · 25 Lakh+ happy women
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:flex-shrink-0">
          <Link
            to={FRONTEND_ROUTES.SHOP}
            className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full px-6 text-[14px] font-bold text-white sm:flex-none ${BRAND_GRADIENT} shadow-[0_6px_20px_rgba(214,0,138,0.28)] hover:-translate-y-px hover:opacity-95 transition-all ${FOCUS_RING}`}
          >
            Shop Now <ArrowRight size={16} aria-hidden="true" />
          </Link>
          {isGuest && (
            <Link
              to={FRONTEND_ROUTES.LOGIN}
              className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#d6008a] bg-white px-5 text-[14px] font-bold text-[#d6008a] hover:border-[#9d0063] hover:bg-[#fff5fa] hover:text-[#9d0063] sm:flex-none transition-colors ${FOCUS_RING}`}
            >
              <LogIn size={16} aria-hidden="true" /> Login / Sign Up
            </Link>
          )}
        </div>
      </div>
    </div>
  </section>
);

export default HomeHero;
