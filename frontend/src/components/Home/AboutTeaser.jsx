import { useId } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "./Reveal";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { BRAND_GRADIENT, CONTAINER, FOCUS_RING } from "../../constants/customerTheme";

// A taste of the 11-in-1 technology (photos from public/about), linking to the About page
const HIGHLIGHTS = [
  { title: "Breathable sheets", text: "Air flows, skin stays cool", image: "/about/web/about1-feat-breathable.webp" },
  { title: "Japan SAP core", text: "Locks liquid, no leaks", image: "/about/web/about5-feat-sap.webp" },
  { title: "Green tea extract", text: "Natural freshness", image: "/about/web/about9-feat-tea.webp" },
  { title: "No harmful chemicals", text: "Gentle on sensitive skin", image: "/about/web/about11-feat-organic.webp" },
];

const AboutTeaser = () => {
  const headingId = useId();
  return (
    <Reveal aria-labelledby={headingId} className="bg-white py-12 md:py-16">
      <div className={CONTAINER}>
        <div className="mx-auto grid max-w-[1240px] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14">
          <div className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-[2rem] border border-pink-100 bg-[#fff5fa]">
            <img
              src="/auth/girl-half-body-1080.webp"
              srcSet="/auth/girl-half-body-560.webp 560w, /auth/girl-half-body-1080.webp 1080w"
              sizes="(min-width: 1024px) 520px, 90vw"
              alt="Smiling young woman pointing at a pack of Care N Safe sanitary napkins"
              width={1080}
              height={1024}
              loading="lazy"
              className="block h-auto w-full"
            />
            <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-[#1e1a3a] shadow-sm">
              Made in Chennai · Loved across India
            </span>
          </div>

          <div>
            <span className="inline-flex items-center rounded-full border border-pink-100 bg-white px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#d6008a]">
              Inside every pad
            </span>
            <h2 id={headingId} className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight text-[#1e1a3a] sm:text-[36px]">
              11-in-1 technology, <span className="font-accent font-medium italic text-[#d6008a]">made for you</span>
            </h2>
            <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-slate-600">
              Organic cotton, plant extracts and smart layers working together for protection, comfort and intimate hygiene.
            </p>

            <ul className="mt-6 grid grid-cols-2 gap-3">
              {HIGHLIGHTS.map(({ title, text, image }) => (
                <li key={title} className="overflow-hidden rounded-2xl border border-slate-100 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(59,42,138,0.10)]">
                  <img src={image} alt="" width={900} height={600} loading="lazy" className="block aspect-[3/2] w-full object-cover" />
                  <div className="p-3">
                    <p className="text-[13.5px] font-bold text-[#1e1a3a]">{title}</p>
                    <p className="text-[12px] text-slate-500">{text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              to={FRONTEND_ROUTES.ABOUT}
              className={`mt-6 inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-bold text-white ${BRAND_GRADIENT} shadow-[0_6px_20px_rgba(214,0,138,0.28)] hover:-translate-y-px hover:opacity-95 transition-all ${FOCUS_RING}`}
            >
              Discover our story &amp; technology <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </Reveal>
  );
};

export default AboutTeaser;
