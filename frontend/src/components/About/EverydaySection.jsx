import { useId } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, HeartHandshake, Leaf, ShieldCheck } from "lucide-react";
import Reveal from "../Home/Reveal";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { BRAND_GRADIENT, CONTAINER, FOCUS_RING } from "../../constants/customerTheme";

const PROMISES = [
  { icon: Leaf, title: "Gentle by nature", text: "Organic cotton and plant extracts, free from bleach, perfume and harsh additives." },
  { icon: ShieldCheck, title: "Protection you can trust", text: "A 9-layer system with a Japanese SAP core for leak-free days and nights." },
  { icon: HeartHandshake, title: "Made for real life", text: "Thin, flexible and breathable, so you can work, travel and play with confidence." },
];

// Full-body photo (public/girl2.png) + three promises
const EverydaySection = () => {
  const headingId = useId();
  return (
    <Reveal aria-labelledby={headingId} className={`${CONTAINER} py-12 md:py-16`}>
      <div className="mx-auto grid max-w-[1100px] items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-14">
        <div className="relative mx-auto flex h-[380px] w-full max-w-[420px] items-end justify-center overflow-hidden rounded-[2rem] border border-pink-100 bg-[#fff5fa] sm:h-[460px]">
          <img
            src="/auth/girl-holding-pack.webp"
            alt="Young woman in a pink dress holding a Care N Safe pack"
            width={408}
            height={612}
            loading="lazy"
            className="relative h-[94%] w-auto object-contain object-bottom drop-shadow-[0_18px_30px_rgba(59,42,138,0.22)]"
          />
        </div>

        <div>
          <span className="inline-flex items-center rounded-full border border-pink-100 bg-white px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#d6008a]">
            Our promise
          </span>
          <h2 id={headingId} className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight text-[#1e1a3a] sm:text-[36px]">
            Made for <span className="font-accent font-medium italic text-[#d6008a]">every day</span>, every flow
          </h2>
          <ul className="mt-6 flex flex-col gap-4">
            {PROMISES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_8px_24px_-18px_rgba(59,42,138,0.35)]">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#fff5fa] text-[#d6008a]">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[15px] font-bold text-[#1e1a3a]">{title}</span>
                  <span className="mt-0.5 block text-[13.5px] leading-relaxed text-slate-600">{text}</span>
                </span>
              </li>
            ))}
          </ul>
          <Link
            to={FRONTEND_ROUTES.SHOP}
            className={`mt-6 inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-bold text-white ${BRAND_GRADIENT} shadow-[0_6px_20px_rgba(214,0,138,0.28)] hover:-translate-y-px hover:opacity-95 transition-all ${FOCUS_RING}`}
          >
            Shop now <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </Reveal>
  );
};

export default EverydaySection;
