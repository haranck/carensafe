import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { m } from "framer-motion";
import { Search } from "lucide-react";
import { BRAND_GRADIENT, FOCUS_RING, buildShopSearch } from "./navConfig";

// Dropdown search under the header capsule (lg to xl; xl+ uses the inline HeaderSearchBar)
const SearchPanel = ({ id, onClose }) => {
  const [query, setQuery] = useState("");
  const panelRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    const handlePointer = (e) => {
      // The header toggle button handles its own clicks
      if (e.target.closest?.("[data-search-toggle]")) return;
      if (!panelRef.current?.contains(e.target)) onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handlePointer);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handlePointer);
    };
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;
    onClose();
    navigate(buildShopSearch(term));
  };

  return (
    <m.div
      id={id}
      ref={panelRef}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute inset-x-0 top-full mt-2 rounded-2xl border border-violet-100 bg-white shadow-[0_18px_40px_-16px_rgba(59,42,138,0.3)]"
    >
      <form role="search" onSubmit={handleSubmit} className="flex items-center gap-3 p-3">
        <label htmlFor={`${id}-input`} className="sr-only">
          Search products
        </label>
        <div className="flex-1 flex items-center gap-3 h-12 px-4 rounded-full border border-slate-200 bg-slate-50/80 focus-within:bg-white focus-within:border-[#d6008a] focus-within:shadow-[0_0_0_3px_rgba(214,0,138,0.12)] transition-all">
          <Search size={18} aria-hidden="true" className="text-slate-400 flex-shrink-0" />
          <input
            id={`${id}-input`}
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pads, liners, night care…"
            className="flex-1 min-w-0 bg-transparent outline-none text-[14.5px] text-slate-800 placeholder:text-slate-400"
          />
        </div>
        <button
          type="submit"
          className={`h-12 px-6 rounded-full text-[14px] font-bold text-white ${BRAND_GRADIENT} hover:opacity-90 transition-opacity ${FOCUS_RING}`}
        >
          Search
        </button>
      </form>
    </m.div>
  );
};

export default SearchPanel;
