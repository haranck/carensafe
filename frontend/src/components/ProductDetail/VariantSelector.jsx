import { FOCUS_RING } from "../../constants/customerTheme";
import { formatPrice } from "../../utils/product";

const pillClass = (isSelected, inStock) => {
  if (isSelected) return "border-[#d6008a] bg-[#fff5fa] text-[#d6008a]";
  if (!inStock) return "cursor-not-allowed border-dashed border-slate-200 bg-slate-50 text-slate-400";
  return "border-slate-200 bg-white text-[#1e1a3a] hover:border-pink-300 hover:text-[#d6008a]";
};

// Size pills; out-of-stock variants stay visible but can't be picked
const VariantSelector = ({ variants, selectedId, onSelect }) => {
  const selected = variants.find((variant) => variant._id === selectedId);

  return (
    <fieldset>
      <legend className="text-[13.5px] font-bold text-[#1e1a3a]">
        Select Size{selected && <span className="font-semibold text-slate-500">: {selected.size}</span>}
      </legend>

      <div className="mt-3 flex flex-wrap gap-x-2.5 gap-y-3">
        {variants.map((variant) => {
          const isSelected = variant._id === selectedId;
          const inStock = variant.stock > 0;

          return (
            <div key={variant._id} className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => onSelect(variant._id)}
                disabled={!inStock}
                aria-pressed={isSelected}
                className={`inline-flex h-11 items-center gap-1.5 rounded-full border-2 px-5 text-[13.5px] font-bold transition-colors ${FOCUS_RING} ${pillClass(
                  isSelected,
                  inStock
                )}`}
              >
                <span className={inStock ? "" : "line-through"}>{variant.size}</span>
                <span aria-hidden="true" className="opacity-50">
                  ·
                </span>
                <span className="font-semibold">{formatPrice(variant.price)}</span>
                {!inStock && <span className="sr-only">(out of stock)</span>}
              </button>
              {!inStock && (
                <span aria-hidden="true" className="text-[10.5px] font-semibold text-rose-500">
                  Out of stock
                </span>
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
};

export default VariantSelector;
