import { bucketTitle, swatchClass } from "../../../utils/report";

// Recharts tooltip: bucket title, then one row per series (swatch carries the colour, text stays slate)
const ChartTooltip = ({ active, payload, label, formatValue = (value) => value, title = bucketTitle }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[160px] rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-lg">
      <p className="mb-1.5 text-[12px] font-bold text-slate-500">{title(label)}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-[13px]">
          <span className="flex items-center gap-2 text-slate-600">
            <span className={`h-2.5 w-2.5 rounded-sm ${swatchClass(entry.color)}`} aria-hidden="true" />
            {entry.name}
          </span>
          <span className="font-bold text-slate-800">{formatValue(entry.value, entry.dataKey)}</span>
        </div>
      ))}
    </div>
  );
};

export default ChartTooltip;
