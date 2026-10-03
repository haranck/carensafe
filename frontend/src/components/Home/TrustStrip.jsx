import { Leaf, Sparkles, ShieldCheck, Truck } from "lucide-react";
import { CONTAINER } from "../../constants/customerTheme";

const TRUST_ITEMS = [
  { icon: Leaf, title: "100% Organic Cotton", text: "Soft, breathable, chemical-free" },
  { icon: Sparkles, title: "Rash-Free Comfort", text: "Gentle on sensitive skin" },
  { icon: ShieldCheck, title: "11-in-1 Protection", text: "Leak-proof, day and night" },
  { icon: Truck, title: "Free Delivery", text: "On orders above ₹399" },
];

// Scrolls sideways inside its own box on mobile; 4-column grid from md up
const TrustStrip = () => (
  <section aria-label="Why women choose Care N Safe" className={`${CONTAINER} pt-6`}>
    <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
      {TRUST_ITEMS.map(({ icon: Icon, title, text }) => (
        <li
          key={title}
          className="flex min-w-[220px] snap-start items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 shadow-[0_4px_16px_-10px_rgba(59,42,138,0.15)] md:min-w-0 xl:px-5 xl:py-4"
        >
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#fff5fa] text-[#d6008a]">
            <Icon size={19} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-[#1e1a3a]">{title}</p>
            <p className="text-[11.5px] text-slate-500">{text}</p>
          </div>
        </li>
      ))}
    </ul>
  </section>
);

export default TrustStrip;
