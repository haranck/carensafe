import { useEffect, useId, useRef, useState } from "react";
import { m } from "framer-motion";
import { X } from "lucide-react";
import FilterPanel from "./FilterPanel";
import { BRAND_GRADIENT, FOCUS_RING } from "../../constants/customerTheme";

const EMPTY_DRAFT = { sizes: [], minPrice: "", maxPrice: "", combo: false, inStock: false };

const pickDrawerFilters = ({ sizes, minPrice, maxPrice, combo, inStock }) => ({ sizes, minPrice, maxPrice, combo, inStock });

// Mobile / tablet filters: edits a draft, "Apply" writes it to the URL. Render inside <AnimatePresence>.
const FilterDrawer = ({ options, isLoading, filters, onApply, onClose }) => {
  const titleId = useId();
  const closeButtonRef = useRef(null);
  const [draft, setDraft] = useState(() => pickDrawerFilters(filters));

  // Lock body scroll, move focus into the drawer, close on Escape, restore focus on close
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <>
      <m.div
        aria-hidden="true"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[150] bg-[#1e1a3a]/40 backdrop-blur-sm lg:hidden"
      />

      <m.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "tween", duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
        className="fixed inset-y-0 left-0 z-[160] flex w-[88%] max-w-[380px] flex-col bg-[#fdfbff] shadow-2xl lg:hidden"
      >
        <div className="flex h-16 items-center justify-between border-b border-violet-100 bg-white px-5">
          <h2 id={titleId} className="text-[17px] font-extrabold text-[#1e1a3a]">
            Filters
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-pink-50 hover:text-[#d6008a] transition-colors ${FOCUS_RING}`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          <FilterPanel
            options={options}
            isLoading={isLoading}
            value={draft}
            onChange={(updates) => setDraft((current) => ({ ...current, ...updates }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-violet-100 bg-white p-4">
          <button
            type="button"
            onClick={() => setDraft(EMPTY_DRAFT)}
            className={`inline-flex h-12 items-center justify-center rounded-full border-2 border-[#d6008a] bg-white text-[14px] font-bold text-[#d6008a] hover:bg-[#fff5fa] transition-colors ${FOCUS_RING}`}
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={handleApply}
            className={`inline-flex h-12 items-center justify-center rounded-full text-[14px] font-bold text-white shadow-[0_6px_18px_rgba(124,58,237,0.28)] hover:brightness-110 transition-all ${BRAND_GRADIENT} ${FOCUS_RING}`}
          >
            Apply
          </button>
        </div>
      </m.div>
    </>
  );
};

export default FilterDrawer;
