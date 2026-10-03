import { useId } from "react";
import { Wind, Leaf, Atom, Droplets, Layers, FlaskConicalOff } from "lucide-react";
import Reveal from "./Reveal";
import { BRAND_GRADIENT, CONTAINER } from "../../constants/customerTheme";

// Benefit copy adapted from the live site's 11-in-1 technology section
const FEATURES = [
  { icon: Wind, title: "Breathable Sheets", text: "Front and back sheets let air flow, so you stay cool and dry." },
  { icon: Leaf, title: "Green Tea Extract", text: "Natural tea polyphenols help keep odour in check." },
  { icon: Atom, title: "Anion Layer", text: "Designed for a fresher, cleaner feel all day." },
  { icon: Droplets, title: "High-Absorption SAP", text: "A Japanese SAP core locks fluid away fast to stop leaks." },
  { icon: Layers, title: "9-Layer Protection", text: "Layers work together for confidence on heavy-flow days." },
  { icon: FlaskConicalOff, title: "No Harmful Chemicals", text: "Free from bleach, perfumes and harsh additives." },
];

const HIGHLIGHTS = ["100% Organic Cotton", "NABL Certified", "Made in India"];

const WhyCareNSafe = () => {
  const headingId = useId();

  return (
    <Reveal aria-labelledby={headingId} className={`${CONTAINER} py-12 md:py-16`}>
      <div className={`relative overflow-hidden rounded-[2rem] ${BRAND_GRADIENT} px-6 py-10 text-white sm:px-10 sm:py-14 xl:px-14 xl:py-16`}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_320px_at_0%_0%,rgba(255,255,255,0.14),transparent_70%),radial-gradient(560px_340px_at_100%_100%,rgba(249,168,212,0.22),transparent_70%)]"
        />

        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center">
          <div>
            <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em]">
              11-in-1 Technology
            </span>
            <h2 id={headingId} className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight sm:text-[36px]">
              Why Care N Safe? Science meets{" "}
              <span className="font-accent font-medium italic text-pink-200">nature</span>.
            </h2>
            <p className="mt-3 max-w-[420px] text-[14.5px] leading-relaxed text-white/80">
              Every pad starts with 100% organic cotton and adds layered protection, so you feel dry, fresh and
              confident from morning to night.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {HIGHLIGHTS.map((label) => (
                <li
                  key={label}
                  className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[12px] font-semibold text-white/90"
                >
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3 rounded-2xl border border-white/15 bg-white/10 p-4">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#d6008a]">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-[14px] font-bold">{title}</h3>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/75">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Reveal>
  );
};

export default WhyCareNSafe;
