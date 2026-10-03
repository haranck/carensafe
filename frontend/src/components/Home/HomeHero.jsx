import { Link } from "react-router-dom";
import { ArrowRight, Leaf, ShieldCheck, Star } from "lucide-react";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { BRAND_GRADIENT, CONTAINER, FOCUS_RING } from "../../constants/customerTheme";

const HomeHero = ({ firstName }) => (
  <section className={`${CONTAINER} pt-6 sm:pt-8`}>
    <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[1.75rem] border border-pink-100 bg-white bg-[radial-gradient(560px_280px_at_92%_0%,rgba(214,0,138,0.12),transparent_70%),radial-gradient(480px_260px_at_30%_110%,rgba(124,58,237,0.10),transparent_70%)] px-6 py-7 sm:px-8 sm:py-8 xl:px-10 xl:py-9">
      <div className="relative grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_200px] lg:grid-cols-[minmax(0,1fr)_230px] xl:grid-cols-[minmax(0,1fr)_250px]">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-white px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.16em] text-emerald-700">
            <Leaf size={13} aria-hidden="true" /> 100% Organic Cotton
          </span>

          <p className="mt-4 text-[14px] font-medium text-slate-500">Welcome back, {firstName || "there"} 👋</p>
          <h1 className="mt-1 text-[28px] font-extrabold leading-[1.1] tracking-tight text-[#1e1a3a] sm:text-[34px] xl:text-[40px]">
            Comfort you can <span className="font-accent font-medium italic text-[#d6008a]">trust</span>, every day.
          </h1>
          <p className="mt-2.5 max-w-[500px] text-[14px] leading-relaxed text-slate-500 xl:text-[15px]">
            Breathable organic cotton pads with 11-in-1 protection, gentle on sensitive skin and made to keep you
            fresh all day.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              to={FRONTEND_ROUTES.SHOP}
              className={`inline-flex h-11 items-center gap-2 rounded-full px-6 text-[14px] font-bold text-white ${BRAND_GRADIENT} shadow-[0_6px_20px_rgba(214,0,138,0.28)] hover:-translate-y-px hover:opacity-95 transition-all ${FOCUS_RING}`}
            >
              Shop Now <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500">
              <Star size={14} aria-hidden="true" className="fill-amber-400 text-amber-400" />
              4.9 · 25 Lakh+ happy women
            </span>
          </div>
        </div>

        <div className="relative hidden md:block">
          <div className="aspect-square overflow-hidden rounded-[1.5rem] border-4 border-white shadow-[0_16px_40px_rgba(59,42,138,0.18)]">
            <img
              src="/product.webp"
              alt="Care N Safe organic sanitary pads"
              width={250}
              height={250}
              fetchPriority="high"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="absolute -bottom-2 -left-3 inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-1.5 text-[12px] font-bold text-[#1e1a3a] shadow-[0_10px_24px_rgba(59,42,138,0.15)]">
            <ShieldCheck size={16} aria-hidden="true" className="text-[#d6008a]" /> NABL Certified
          </span>
        </div>
      </div>
    </div>
  </section>
);

export default HomeHero;
