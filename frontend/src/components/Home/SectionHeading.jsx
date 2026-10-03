import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { FOCUS_RING } from "../../constants/customerTheme";

export const ViewAllLink = ({ to = FRONTEND_ROUTES.SHOP, label = "View All" }) => (
  <Link
    to={to}
    className={`inline-flex h-10 w-fit flex-shrink-0 items-center gap-1.5 rounded-full border border-pink-200 bg-white px-4 text-[13px] font-bold text-[#d6008a] hover:bg-[#fff5fa] hover:border-[#d6008a] transition-colors ${FOCUS_RING}`}
  >
    {label} <ArrowRight size={15} aria-hidden="true" />
  </Link>
);

// Eyebrow pill + heading with one italic serif accent phrase
const SectionHeading = ({ id, eyebrow, before, accent, after, description, action }) => (
  <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="max-w-[620px]">
      <span className="inline-flex items-center rounded-full border border-pink-100 bg-white px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#d6008a]">
        {eyebrow}
      </span>
      <h2 id={id} className="mt-3 text-[26px] font-extrabold leading-tight tracking-tight text-[#1e1a3a] sm:text-[32px]">
        {before && <>{before} </>}
        <span className="font-accent font-medium italic text-[#d6008a]">{accent}</span>
        {after && <> {after}</>}
      </h2>
      {description && <p className="mt-2 text-[14px] leading-relaxed text-slate-500">{description}</p>}
    </div>
    {action}
  </div>
);

export default SectionHeading;
