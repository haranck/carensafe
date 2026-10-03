import { BRAND_GRADIENT, FOCUS_RING } from "../../constants/customerTheme";

// Quick filters from GET /filters: All + every category on sale + Combo Packs when there are any
const CategoryChips = ({ options, category, combo, onChange }) => {
  const chips = [
    { key: "all", label: "All", isActive: !category && !combo, updates: { category: "", combo: false } },
    ...(options?.categories || []).map(({ value, label }) => ({
      key: value,
      label,
      isActive: category === value && !combo,
      updates: { category: value, combo: false },
    })),
    ...(options?.comboCount > 0
      ? [{ key: "combo", label: "Combo Packs", isActive: combo, updates: { category: "", combo: true } }]
      : []),
  ];

  return (
    <div
      role="group"
      aria-label="Product categories"
      className="-mx-4 flex gap-2 overflow-x-auto scroll-px-4 px-4 py-1 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {chips.map(({ key, label, isActive, updates }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(updates)}
          aria-pressed={isActive}
          className={`inline-flex h-10 flex-shrink-0 items-center rounded-full px-5 text-[13px] font-semibold whitespace-nowrap transition-all ${FOCUS_RING} ${
            isActive
              ? `${BRAND_GRADIENT} text-white shadow-[0_4px_14px_rgba(124,58,237,0.25)]`
              : "border border-slate-200 bg-white text-slate-600 hover:border-pink-200 hover:text-[#d6008a]"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default CategoryChips;
