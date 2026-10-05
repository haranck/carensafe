import { Award, Factory, Heart, Leaf } from "lucide-react";
import Reveal from "../Home/Reveal";
import { CONTAINER } from "../../constants/customerTheme";

const STATS = [
  { icon: Heart, value: "25 Lakh+", label: "Happy women" },
  { icon: Leaf, value: "100%", label: "Organic cotton" },
  { icon: Award, value: "NABL", label: "Lab certified" },
  { icon: Factory, value: "Made in", label: "India, with care" },
];

const AboutStats = () => (
  <Reveal aria-label="Care N Safe in numbers" className={`${CONTAINER} py-10`}>
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {STATS.map(({ icon: Icon, value, label }) => (
        <li key={label} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_8px_24px_-18px_rgba(59,42,138,0.35)] sm:p-5">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#fff5fa] text-[#d6008a]">
            <Icon size={21} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-[16px] font-extrabold leading-tight text-[#1e1a3a] sm:text-[22px]">{value}</span>
            <span className="block text-[12.5px] font-semibold text-slate-500">{label}</span>
          </span>
        </li>
      ))}
    </ul>
  </Reveal>
);

export default AboutStats;
