import { Link } from "react-router-dom";
import { m } from "framer-motion";
import { ArrowRight, Leaf, ShieldCheck, Star } from "lucide-react";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { BRAND_GRADIENT, CONTAINER, FOCUS_RING } from "../../constants/customerTheme";

const Badge = ({ className, children }) => (
  <span
    className={`absolute z-20 inline-flex items-center gap-1.5 whitespace-nowrap rounded-2xl bg-white/90 px-3 py-2 text-[12px] font-bold text-[#1e1a3a] shadow-[0_10px_28px_rgba(59,42,138,0.18)] backdrop-blur-sm ${className}`}
  >
    {children}
  </span>
);

// Brand story + half-body photo (public/girl1.png, cropped WebP)
const AboutHero = ({ headingId }) => (
  <section aria-labelledby={headingId} className={`${CONTAINER} pt-6 sm:pt-10`}>
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="grid items-stretch gap-8 overflow-hidden rounded-[2rem] border border-pink-100 bg-[#fff5fa] shadow-[0_24px_60px_-30px_rgba(59,42,138,0.35)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
    >
      <div className="relative z-10 flex flex-col justify-center px-6 pt-8 sm:px-10 sm:pt-12 lg:py-14 lg:pl-14">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-pink-200 bg-white/80 px-3.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#d6008a]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#d6008a]" />
          Our story
        </span>
        <h1 id={headingId} className="mt-4 text-[32px] font-extrabold leading-[1.08] tracking-tight text-[#1e1a3a] sm:text-[44px] xl:text-[52px]">
          Care for <span className="font-accent font-medium italic text-[#d6008a]">today</span>, a safer tomorrow.
        </h1>
        <p className="mt-4 max-w-[560px] text-[15px] leading-relaxed text-slate-600">
          Care N Safe was started in Chennai with one simple belief: every woman deserves period care that is safe for her
          body and kind to her skin. We combine 100% organic cotton with an 11-in-1 protection system — science and nature,
          working together.
        </p>
        <p className="mt-3 max-w-[560px] text-[14px] leading-relaxed text-slate-500">
          Made in India by Unisafe Enterprises, tested in NABL-accredited labs, and trusted by over 25 lakh women.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={FRONTEND_ROUTES.SHOP}
            className={`inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-bold text-white ${BRAND_GRADIENT} shadow-[0_6px_20px_rgba(214,0,138,0.28)] hover:-translate-y-px hover:opacity-95 transition-all ${FOCUS_RING}`}
          >
            Shop the range <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link
            to={FRONTEND_ROUTES.CONTACT}
            className={`inline-flex h-12 items-center rounded-full border-2 border-[#d6008a] bg-white px-6 text-[15px] font-bold text-[#d6008a] hover:bg-[#fff5fa] hover:text-[#9d0063] transition-colors ${FOCUS_RING}`}
          >
            Talk to us
          </Link>
        </div>
      </div>

      <div className="relative min-h-[340px] sm:min-h-[420px]">
        <img
          src="/auth/girl-half-body-1080.webp"
          srcSet="/auth/girl-half-body-560.webp 560w, /auth/girl-half-body-1080.webp 1080w"
          sizes="(min-width: 1024px) 560px, 90vw"
          alt="Smiling young woman pointing at a pack of Care N Safe sanitary napkins"
          width={1080}
          height={1024}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-contain object-bottom drop-shadow-[0_18px_30px_rgba(59,42,138,0.22)]"
        />
        <Badge className="left-4 top-8 sm:left-8">
          <Star size={14} aria-hidden="true" className="fill-amber-400 text-amber-400" /> 4.9 · 25 Lakh+ women
        </Badge>
        <Badge className="bottom-16 left-4 sm:left-8">
          <Leaf size={14} aria-hidden="true" className="text-emerald-600" /> 100% Organic Cotton
        </Badge>
        <Badge className="bottom-6 right-4 sm:right-8">
          <ShieldCheck size={14} aria-hidden="true" className="text-[#d6008a]" /> NABL Certified
        </Badge>
      </div>
    </m.div>
  </section>
);

export default AboutHero;
