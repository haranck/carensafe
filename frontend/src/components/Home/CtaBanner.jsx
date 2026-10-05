import { useId } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "./Reveal";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { BRAND_GRADIENT, CONTAINER, FOCUS_RING } from "../../constants/customerTheme";

const CtaBanner = () => {
  const headingId = useId();

  return (
    <Reveal aria-labelledby={headingId} className={`${CONTAINER} py-12 md:py-16`}>
      <div className={`relative overflow-hidden rounded-[2rem] ${BRAND_GRADIENT} px-6 py-12 text-center text-white sm:px-12 sm:py-14`}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_300px_at_100%_0%,rgba(255,255,255,0.16),transparent_70%),radial-gradient(480px_280px_at_0%_100%,rgba(249,168,212,0.2),transparent_70%)]"
        />
        <h2 id={headingId} className="relative text-[26px] font-extrabold leading-tight tracking-tight sm:text-[34px]">
          Ready for your <span className="font-accent font-medium italic text-pink-200">next pack</span>?
        </h2>
        <p className="relative mx-auto mt-3 max-w-[460px] text-[14.5px] leading-relaxed text-white/80">
          Stock up on breathable, organic protection. Free delivery on orders above ₹399.
        </p>
        <Link
          to={FRONTEND_ROUTES.SHOP}
          className={`relative mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-[14.5px] font-bold text-[#d6008a] shadow-[0_10px_30px_rgba(30,26,58,0.25)] hover:-translate-y-px hover:bg-[#fff5fa] transition-all ${FOCUS_RING}`}
        >
          Shop All Products <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </Reveal>
  );
};

export default CtaBanner;
