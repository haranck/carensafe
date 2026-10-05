import { useId, useState } from "react";
import { PRICE_PRESETS } from "../../constants/shopOptions";
import { FOCUS_RING } from "../../constants/customerTheme";

const PILL_BASE = `inline-flex h-10 items-center justify-center rounded-full border-2 font-bold transition-colors ${FOCUS_RING}`;
const PILL = `${PILL_BASE} px-4 text-[13px]`;
const PRESET_PILL = `${PILL_BASE} px-3 text-[12.5px]`;
const PILL_ON = "border-[#d6008a] bg-[#fff5fa] text-[#d6008a]";
const PILL_OFF = "border-slate-200 bg-white text-[#1e1a3a] hover:border-pink-300 hover:text-[#d6008a]";

const SectionTitle = ({ children }) => (
  <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] text-slate-400">{children}</h3>
);

const Toggle = ({ label, hint, checked, onToggle }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onToggle}
    className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl text-left ${FOCUS_RING}`}
  >
    <span>
      <span className="block text-[13.5px] font-semibold text-[#1e1a3a]">{label}</span>
      {hint && <span className="block text-[12px] text-slate-500">{hint}</span>}
    </span>
    <span
      aria-hidden="true"
      className={`inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full p-0.5 transition-colors ${
        checked ? "bg-[#d6008a]" : "bg-slate-200"
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </span>
  </button>
);

const digitsOnly = (value) => value.replace(/\D/g, "").slice(0, 7);

// Min / max inputs applied on blur or Enter (not per keystroke), plus preset ranges
const PriceFilter = ({ minPrice, maxPrice, priceRange, onChange }) => {
  const minId = useId();
  const maxId = useId();
  const errorId = useId();
  const [draft, setDraft] = useState({ min: minPrice, max: maxPrice });
  const [error, setError] = useState("");
  const [applied, setApplied] = useState({ minPrice, maxPrice });

  // Applied range changed elsewhere (chip removed, Clear all, back button) → reset the inputs
  if (applied.minPrice !== minPrice || applied.maxPrice !== maxPrice) {
    setApplied({ minPrice, maxPrice });
    setDraft({ min: minPrice, max: maxPrice });
    setError("");
  }

  const commit = () => {
    if (draft.min && draft.max && Number(draft.min) > Number(draft.max)) {
      setError("Min price can't be more than max price.");
      return;
    }
    setError("");
    if (draft.min !== minPrice || draft.max !== maxPrice) onChange({ minPrice: draft.min, maxPrice: draft.max });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
  };

  const input = (id, key, label, placeholder) => (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="mb-1 block text-[12px] font-semibold text-slate-500">
        {label}
      </label>
      <div className="relative">
        <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400">
          ₹
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={draft[key]}
          onChange={(e) => setDraft((d) => ({ ...d, [key]: digitsOnly(e.target.value) }))}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`h-10 w-full rounded-xl border bg-white pl-7 pr-2 text-[13.5px] text-[#1e1a3a] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#d6008a]/20 ${
            error ? "border-rose-300" : "border-slate-200 focus:border-[#d6008a]"
          }`}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        {input(minId, "min", "Min", priceRange ? String(priceRange.min) : "0")}
        <span aria-hidden="true" className="pb-2.5 text-slate-300">
          –
        </span>
        {input(maxId, "max", "Max", priceRange ? String(priceRange.max) : "Any")}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-[12px] font-semibold text-rose-600">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {PRICE_PRESETS.map((preset) => {
          const isActive = minPrice === preset.minPrice && maxPrice === preset.maxPrice;
          return (
            <button
              key={preset.label}
              type="button"
              aria-pressed={isActive}
              onClick={() =>
                onChange(isActive ? { minPrice: "", maxPrice: "" } : { minPrice: preset.minPrice, maxPrice: preset.maxPrice })
              }
              className={`${PRESET_PILL} ${isActive ? PILL_ON : PILL_OFF}`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Size, price, combo and stock filters. Used by the desktop sidebar (applies straight to the URL)
 * and the mobile drawer (edits a draft until "Apply").
 * value: { sizes, minPrice, maxPrice, combo, inStock }; onChange receives partial updates.
 */
const FilterPanel = ({ options, isLoading, value, onChange, onClear }) => {
  const sizes = options?.sizes || [];

  const toggleSize = (size) =>
    onChange({
      sizes: value.sizes.includes(size) ? value.sizes.filter((s) => s !== size) : [...value.sizes, size],
    });

  return (
    <div className="space-y-6">
      {onClear && (
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-extrabold text-[#1e1a3a]">Filters</h2>
          <button
            type="button"
            onClick={onClear}
            className={`min-h-10 rounded-md text-[13px] font-bold text-[#d6008a] hover:text-[#9d0063] hover:underline underline-offset-4 ${FOCUS_RING}`}
          >
            Clear all
          </button>
        </div>
      )}

      {(isLoading || sizes.length > 0) && (
        <section className="space-y-3">
          <SectionTitle>Size</SectionTitle>
          {isLoading ? (
            <div aria-hidden="true" className="flex animate-pulse gap-2">
              <div className="h-10 w-14 rounded-full bg-slate-100" />
              <div className="h-10 w-14 rounded-full bg-slate-100" />
              <div className="h-10 w-14 rounded-full bg-slate-100" />
            </div>
          ) : (
            <div role="group" aria-label="Size" className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const isOn = value.sizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    aria-pressed={isOn}
                    className={`${PILL} min-w-[3.25rem] ${isOn ? PILL_ON : PILL_OFF}`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section className="space-y-3">
        <SectionTitle>Price</SectionTitle>
        <PriceFilter
          minPrice={value.minPrice}
          maxPrice={value.maxPrice}
          priceRange={options?.priceRange}
          onChange={onChange}
        />
      </section>

      <section className="space-y-1">
        <SectionTitle>More filters</SectionTitle>
        {options?.comboCount > 0 && (
          <Toggle
            label="Combo packs only"
            hint={`${options.comboCount} value ${options.comboCount === 1 ? "pack" : "packs"}`}
            checked={value.combo}
            onToggle={() => onChange({ combo: !value.combo })}
          />
        )}
        <Toggle label="In stock only" checked={value.inStock} onToggle={() => onChange({ inStock: !value.inStock })} />
      </section>
    </div>
  );
};

export default FilterPanel;
