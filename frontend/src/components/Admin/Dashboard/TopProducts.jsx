import { Package } from "lucide-react";
import { formatMoney } from "../../../utils/report";

// Best sellers by units kept (rows: [{ productId, name, image, units, revenue }])
const TopProducts = ({ rows }) => (
  <ol className="space-y-3">
    {rows.map((row, index) => (
      <li key={row.productId} className="flex items-center gap-3">
        <span className="w-5 shrink-0 text-center text-[13px] font-extrabold text-slate-400">{index + 1}</span>
        {row.image ? (
          <img src={row.image} alt="" className="h-11 w-11 shrink-0 rounded-xl border border-slate-100 object-cover" loading="lazy" />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-300">
            <Package size={18} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-bold text-slate-800">{row.name}</p>
          <p className="text-[12px] text-slate-500">{row.units} units sold</p>
        </div>
        <span className="shrink-0 text-[13.5px] font-bold text-slate-800">{formatMoney(row.revenue)}</span>
      </li>
    ))}
  </ol>
);

export default TopProducts;
