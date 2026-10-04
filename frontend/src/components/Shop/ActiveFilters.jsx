import { X } from "lucide-react";
import { FOCUS_RING } from "../../constants/customerTheme";
import { formatPriceRange } from "../../utils/product";

const buildChips = (filters, categoryLabels) => {
  const chips = [];
  if (filters.search) chips.push({ key: "search", label: `“${filters.search}”`, updates: { search: "" } });
  if (filters.category) {
    chips.push({ key: "category", label: categoryLabels[filters.category] || filters.category, updates: { category: "" } });
  }
  if (filters.combo) chips.push({ key: "combo", label: "Combo packs", updates: { combo: false } });
  filters.sizes.forEach((size) =>
    chips.push({ key: `size-${size}`, label: size, updates: { sizes: filters.sizes.filter((s) => s !== size) } })
  );
  if (filters.minPrice || filters.maxPrice) {
    chips.push({
      key: "price",
      label: formatPriceRange(filters.minPrice, filters.maxPrice),
      updates: { minPrice: "", maxPrice: "" },
    });
  }
  if (filters.inStock) chips.push({ key: "inStock", label: "In stock", updates: { inStock: false } });
  return chips;
};

// Removable chips for every applied filter + Clear all; renders nothing when no filter is applied
const ActiveFilters = ({ filters, categoryLabels, onRemove, onClearAll }) => {
  const chips = buildChips(filters, categoryLabels);
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[12.5px] font-semibold text-slate-500">Filtered by:</span>
      <ul className="contents">
        {chips.map(({ key, label, updates }) => (
          <li key={key}>
            <button
              type="button"
              onClick={() => onRemove(updates)}
              aria-label={`Remove filter: ${label}`}
              className={`inline-flex h-10 items-center gap-1.5 rounded-full border border-pink-200 bg-[#fff5fa] pl-3.5 pr-2.5 text-[12.5px] font-bold text-[#d6008a] hover:border-[#d6008a] hover:bg-white transition-colors ${FOCUS_RING}`}
            >
              {label}
              <X size={14} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onClearAll}
        className={`min-h-10 rounded-md px-1 text-[12.5px] font-bold text-slate-500 hover:text-[#d6008a] hover:underline underline-offset-4 ${FOCUS_RING}`}
      >
        Clear all
      </button>
    </div>
  );
};

export default ActiveFilters;
