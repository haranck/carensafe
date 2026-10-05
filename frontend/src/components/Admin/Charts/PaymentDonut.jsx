import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { PAYMENT_COLORS, PAYMENT_SHORT_LABELS, formatMoney, swatchClass } from "../../../utils/report";

const FALLBACK_COLOR = "#94a3b8";

// Orders by payment method: donut + a legend that repeats every value (colour is never the only cue)
const PaymentDonut = ({ data }) => {
  const total = data.reduce((sum, row) => sum + row.orders, 0);
  const rows = data.map((row) => ({
    ...row,
    label: PAYMENT_SHORT_LABELS[row.method] || row.method,
    color: PAYMENT_COLORS[row.method] || FALLBACK_COLOR,
    share: total ? Math.round((row.orders / total) * 100) : 0,
  }));

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="orders" nameKey="label" innerRadius="66%" outerRadius="100%" paddingAngle={rows.length > 1 ? 2 : 0} stroke="#ffffff" strokeWidth={2}>
              {rows.map((row) => (
                <Cell key={row.method} fill={row.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip title={() => "Orders"} formatValue={(value) => `${value} (${total ? Math.round((value / total) * 100) : 0}%)`} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[24px] font-extrabold leading-none text-slate-800">{total}</span>
          <span className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Orders</span>
        </div>
      </div>
      <ul className="w-full space-y-3">
        {rows.map((row) => (
          <li key={row.method} className="flex items-start justify-between gap-3 text-[13px]">
            <span className="flex items-center gap-2 font-semibold text-slate-700">
              <span className={`h-3 w-3 shrink-0 rounded-sm ${swatchClass(row.color)}`} aria-hidden="true" />
              {row.label}
            </span>
            <span className="text-right">
              <span className="block font-bold text-slate-800">
                {row.orders} · {row.share}%
              </span>
              <span className="block text-[12px] text-slate-500">{formatMoney(row.amount)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PaymentDonut;
