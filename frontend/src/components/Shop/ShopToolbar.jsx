import { useEffect, useId, useState } from "react";
import { ChevronDown, Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { SHOP_SORT_OPTIONS } from "../../constants/shopOptions";
import { FOCUS_RING } from "../../constants/customerTheme";

const SEARCH_DEBOUNCE_MS = 400;

const CONTROL = "h-11 rounded-full border border-slate-200 bg-white text-[#1e1a3a] transition-colors";

/**
 * Search (debounced 400ms, clear button), result count, mobile "Filters" button and sort menu.
 * `onSearch` must be stable (useCallback): it runs from a debounce effect.
 */
const ShopToolbar = ({ search, onSearch, sort, onSortChange, resultText, isUpdating, activeFilterCount, onOpenFilters }) => {
  const searchId = useId();
  const sortId = useId();
  const [input, setInput] = useState(search);
  const [lastSearch, setLastSearch] = useState(search);

  // Search changed outside the box (back button, header search, Clear all) → mirror it
  if (search !== lastSearch) {
    setLastSearch(search);
    if (input.trim() !== search) setInput(search);
  }

  useEffect(() => {
    const term = input.trim();
    if (term === search) return undefined;
    const timer = setTimeout(() => onSearch(term), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input, search, onSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() !== search) onSearch(input.trim());
  };

  const clearSearch = () => {
    setInput("");
    if (search) onSearch("");
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form role="search" onSubmit={handleSubmit} className="relative order-1 w-full lg:w-[380px] xl:w-[440px]">
        <label htmlFor={searchId} className="sr-only">
          Search products
        </label>
        <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id={searchId}
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search pads, sizes, combos…"
          maxLength={100}
          autoComplete="off"
          className={`${CONTROL} w-full pl-11 pr-12 text-[14px] placeholder:text-slate-400 focus:border-[#d6008a] focus:outline-none focus:ring-2 focus:ring-[#d6008a]/20 [&::-webkit-search-cancel-button]:hidden`}
        />
        {input && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            className={`absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-[#fff5fa] hover:text-[#d6008a] transition-colors ${FOCUS_RING}`}
          >
            <X size={17} />
          </button>
        )}
      </form>

      <p
        aria-live="polite"
        className="order-3 flex w-full items-center gap-2 text-[13px] font-medium text-slate-500 lg:order-2 lg:w-auto lg:flex-1 lg:justify-end"
      >
        {isUpdating && <Loader2 size={15} aria-hidden="true" className="animate-spin text-[#d6008a]" />}
        {resultText}
      </p>

      <div className="order-2 flex w-full items-center gap-2 lg:order-3 lg:w-auto">
        <button
          type="button"
          onClick={onOpenFilters}
          aria-haspopup="dialog"
          className={`${CONTROL} inline-flex flex-shrink-0 items-center gap-2 px-4 text-[13.5px] font-semibold hover:border-pink-200 hover:text-[#d6008a] lg:hidden ${FOCUS_RING}`}
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d6008a] px-1.5 text-[11px] font-bold text-white">
              {activeFilterCount}
              <span className="sr-only"> active</span>
            </span>
          )}
        </button>

        <div className="relative min-w-0 flex-1 lg:flex-none">
          <label htmlFor={sortId} className="sr-only">
            Sort products
          </label>
          <select
            id={sortId}
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className={`${CONTROL} w-full cursor-pointer appearance-none pl-4 pr-10 text-[13.5px] font-semibold hover:border-pink-200 lg:w-[210px] ${FOCUS_RING}`}
          >
            {SHOP_SORT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                Sort: {label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>
      </div>
    </div>
  );
};

export default ShopToolbar;
