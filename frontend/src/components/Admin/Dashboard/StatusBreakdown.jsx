import { ORDER_STATUS_LABELS } from "../../../utils/order";

const BAR =
  "h-2 w-full overflow-hidden rounded-full appearance-none [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-indigo-500 [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-indigo-500 bg-slate-100";

// All orders by current status, biggest first (rows: [{ status, count }])
const StatusBreakdown = ({ rows }) => {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <ul className="space-y-3.5">
      {rows.map(({ status, count }) => (
        <li key={status}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px]">
            <span className="font-semibold text-slate-700">{ORDER_STATUS_LABELS[status] || status}</span>
            <span className="font-bold text-slate-800">
              {count} <span className="font-medium text-slate-400">· {total ? Math.round((count / total) * 100) : 0}%</span>
            </span>
          </div>
          <progress className={BAR} value={count} max={max} aria-label={`${ORDER_STATUS_LABELS[status] || status}: ${count}`} />
        </li>
      ))}
    </ul>
  );
};

export default StatusBreakdown;
