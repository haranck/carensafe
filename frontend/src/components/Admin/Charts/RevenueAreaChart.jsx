import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { CHART_COLORS, bucketLabel, formatCompactPrice } from "../../../utils/report";
import { formatPrice } from "../../../utils/product";

const AXIS_TICK = { fill: CHART_COLORS.axis, fontSize: 12 };

// One money series over time (data: [{ key, [dataKey]: rupees }])
const RevenueAreaChart = ({ data, dataKey = "net", name = "Net revenue", color = CHART_COLORS.net }) => {
  const gradientId = `area-fill-${dataKey}`;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
        <XAxis dataKey="key" tickFormatter={bucketLabel} tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={20} />
        <YAxis tickFormatter={formatCompactPrice} tick={AXIS_TICK} tickLine={false} axisLine={false} width={60} allowDecimals={false} />
        <Tooltip
          cursor={{ stroke: CHART_COLORS.axis, strokeDasharray: "4 4" }}
          content={<ChartTooltip formatValue={(value) => formatPrice(value)} />}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          name={name}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "#ffffff" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default RevenueAreaChart;
