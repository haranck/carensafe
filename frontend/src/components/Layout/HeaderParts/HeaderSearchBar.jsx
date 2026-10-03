import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";
import { FOCUS_RING, buildShopSearch } from "./navConfig";

// Inline search for wide screens (xl+); narrower screens use the SearchPanel / drawer search
const HeaderSearchBar = () => {
  const [query, setQuery] = useState("");
  const inputId = useId();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const term = query.trim();
    if (term) navigate(buildShopSearch(term));
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="hidden xl:flex h-11 w-[220px] 2xl:w-[300px] items-center rounded-full border border-slate-200 bg-[#fbf8fc] pl-4 pr-1 transition-all duration-200 focus-within:border-[#d6008a] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(214,0,138,0.12)]"
    >
      <label htmlFor={inputId} className="sr-only">
        Search products
      </label>
      <Search size={16} aria-hidden="true" className="flex-shrink-0 text-slate-400" />
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search organic pads…"
        className="min-w-0 flex-1 bg-transparent px-2.5 text-[13.5px] text-slate-800 outline-none placeholder:text-slate-400"
      />
      <button
        type="submit"
        aria-label="Search"
        title="Search"
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#d6008a] to-[#9d0063] text-white shadow-[0_4px_12px_rgba(214,0,138,0.3)] hover:opacity-90 transition-opacity ${FOCUS_RING}`}
      >
        <ArrowRight size={16} />
      </button>
    </form>
  );
};

export default HeaderSearchBar;
