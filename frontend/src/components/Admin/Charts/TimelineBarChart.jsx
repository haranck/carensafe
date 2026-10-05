import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { CHART_COLORS, bucketLabel } from "../../../utils/report";

const AXIS_TICK = { fill: CHART_COLORS.axis, fontSize: 12 };

/**
 * Bars over time. series: [{ dataKey, name, color }]; more than one series is stacked (same unit only), the last one
 * gets the rounded top. formatValue formats tooltip values, formatAxis the y ticks.
 */
const TimelineBarChart = ({ data, series, formatValue = (value) => value, formatAxis, allowDecimals = false }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
      <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
      <XAxis dataKey="key" tickFormatter={bucketLabel} tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={16} />
      <YAxis tickFormatter={formatAxis} tick={AXIS_TICK} tickLine={false} axisLine={false} width={formatAxis ? 60 : 36} allowDecimals={allowDecimals} />
      <Tooltip cursor={{ fill: "#f1f5f9" }} content={<ChartTooltip formatValue={formatValue} />} />
      {series.map(({ dataKey, name, color }, index) => (
        <Bar
          key={dataKey}
          dataKey={dataKey}
          name={name}
          fill={color}
          stackId={series.length > 1 ? "stack" : undefined}
          radius={index === series.length - 1 ? [4, 4, 0, 0] : 0}
          stroke="#ffffff"
          strokeWidth={series.length > 1 ? 1 : 0}
          maxBarSize={36}
        />
      ))}
    </BarChart>
  </ResponsiveContainer>
);

export default TimelineBarChart;
