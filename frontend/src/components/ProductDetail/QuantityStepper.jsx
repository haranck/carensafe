import { Minus, Plus } from "lucide-react";
import { FOCUS_RING } from "../../constants/customerTheme";

const STEP_BUTTON = `inline-flex h-11 w-11 items-center justify-center rounded-full text-[#1e1a3a] hover:bg-[#fff5fa] hover:text-[#d6008a] disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent transition-colors ${FOCUS_RING}`;

// 1..max; `max` is already capped by stock and the per-order limit. `label` names the group for screen readers
// (e.g. "Quantity for <product>" when a page has several steppers).
const QuantityStepper = ({ value, max, onChange, disabled = false, label = "Quantity" }) => (
  <div role="group" aria-label={label} className="inline-flex items-center rounded-full border border-slate-200 bg-white">
    <button
      type="button"
      onClick={() => onChange(value - 1)}
      disabled={disabled || value <= 1}
      aria-label="Decrease quantity"
      className={STEP_BUTTON}
    >
      <Minus size={16} />
    </button>
    <output aria-live="polite" className="w-9 text-center text-[15px] font-bold text-[#1e1a3a]">
      {value}
    </output>
    <button
      type="button"
      onClick={() => onChange(value + 1)}
      disabled={disabled || value >= max}
      aria-label="Increase quantity"
      className={STEP_BUTTON}
    >
      <Plus size={16} />
    </button>
  </div>
);

export default QuantityStepper;
