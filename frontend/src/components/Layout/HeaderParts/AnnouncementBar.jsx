import { useEffect, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { TRUST_POINTS, BRAND_GRADIENT } from "./navConfig";
import { CONTAINER } from "../../../constants/customerTheme";

const ROTATE_MS = 3000;

// className: extra classes on the root (e.g. hide it on phones)
const AnnouncementBar = ({ className = "" }) => {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  // Mobile shows one trust point at a time
  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % TRUST_POINTS.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const { icon: ActiveIcon, label: activeLabel } = TRUST_POINTS[index];

  return (
    <div className={`${BRAND_GRADIENT} text-white/90 text-[11px] font-medium tracking-wide ${className}`}>
      <div className={`${CONTAINER} h-8 flex items-center justify-center`}>
        <div className="md:hidden flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <m.p
              key={activeLabel}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-1.5 whitespace-nowrap"
            >
              <ActiveIcon size={12} aria-hidden="true" />
              {activeLabel}
            </m.p>
          </AnimatePresence>
        </div>

        <ul className="hidden md:flex items-center divide-x divide-white/25">
          {TRUST_POINTS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-1.5 px-4 whitespace-nowrap">
              <Icon size={12} aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AnnouncementBar;
