import { CheckCircle2 } from "lucide-react";

// Active variants running out (variants: [{ _id, variantId, name, variantName, size, stock }])
const LowStockList = ({ variants, threshold }) => {
  if (!variants.length) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <CheckCircle2 size={30} strokeWidth={1.8} aria-hidden="true" className="mb-2 text-emerald-500" />
        <p className="text-[13.5px] font-bold text-slate-700">Stock looks healthy</p>
        <p className="text-[12px] text-slate-500">No active variant has {threshold} or fewer units.</p>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-slate-50">
      {variants.map((variant) => (
        <li key={`${variant._id}-${variant.variantId}`} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-bold text-slate-800">{variant.variantName || variant.name}</p>
            <p className="text-[12px] text-slate-500">Size {variant.size}</p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11.5px] font-bold ${
              variant.stock === 0 ? "border-rose-200 bg-rose-50 text-rose-600" : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {variant.stock === 0 ? "Out of stock" : `${variant.stock} left`}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default LowStockList;
