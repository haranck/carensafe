import { useState } from "react";
import { CalendarRange } from "lucide-react";
import { ADMIN_INPUT, ADMIN_LABEL, ADMIN_PRIMARY_BUTTON } from "../Orders/adminOrderStyles";
import { PERIOD_OPTIONS, todayInputValue } from "../../../utils/report";

const TAB = "h-10 rounded-lg px-3 sm:px-4 text-[13.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20";
const TAB_ACTIVE = "bg-white text-indigo-600 shadow-sm";
const TAB_IDLE = "text-slate-500 hover:text-slate-800";

// Same rule as the backend: "to" not before "from"; neither in the future
const validateRange = (from, to) => {
  if (!from || !to) return "Pick both dates.";
  if (to < from) return '"To" date cannot be before the "From" date.';
  if (to > todayInputValue()) return "Dates can't be in the future.";
  return "";
};

// value: { period, from, to }. Preset periods apply at once; a custom range applies with the button.
const PeriodFilter = ({ value, onChange }) => {
  const [showCustom, setShowCustom] = useState(value.period === "custom");
  const [from, setFrom] = useState(value.from || "");
  const [to, setTo] = useState(value.to || "");
  const [error, setError] = useState("");
  const today = todayInputValue();

  const selectPeriod = (period) => {
    if (period === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    setError("");
    onChange({ period, from: "", to: "" });
  };

  const applyCustom = (event) => {
    event.preventDefault();
    const message = validateRange(from, to);
    setError(message);
    if (!message) onChange({ period: "custom", from, to });
  };

  const activeTab = showCustom ? "custom" : value.period;

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label="Report period" className="flex w-full flex-wrap gap-1 rounded-xl bg-slate-100 p-1 sm:w-fit">
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={activeTab === option.value}
            title={option.hint}
            onClick={() => selectPeriod(option.value)}
            className={`${TAB} flex-1 sm:flex-none ${activeTab === option.value ? TAB_ACTIVE : TAB_IDLE}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {showCustom && (
        <form onSubmit={applyCustom} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="report-from" className={ADMIN_LABEL}>
              From
            </label>
            <input
              id="report-from"
              type="date"
              value={from}
              max={to || today}
              onChange={(e) => setFrom(e.target.value)}
              className={`${ADMIN_INPUT} sm:w-[180px]`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="report-to" className={ADMIN_LABEL}>
              To
            </label>
            <input
              id="report-to"
              type="date"
              value={to}
              min={from || undefined}
              max={today}
              onChange={(e) => setTo(e.target.value)}
              className={`${ADMIN_INPUT} sm:w-[180px]`}
            />
          </div>
          <button type="submit" className={ADMIN_PRIMARY_BUTTON}>
            <CalendarRange size={16} aria-hidden="true" />
            Apply
          </button>
        </form>
      )}
      {error && <p className="text-[13px] font-semibold text-rose-600">{error}</p>}
    </div>
  );
};

export default PeriodFilter;
