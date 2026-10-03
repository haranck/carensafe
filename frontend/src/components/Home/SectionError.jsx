import { CircleAlert, RefreshCw } from "lucide-react";
import { FOCUS_RING } from "../../constants/customerTheme";

const SectionError = ({ message = "We couldn't load products right now.", onRetry, isRetrying }) => (
  <div
    role="alert"
    className="flex flex-col items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50/60 px-6 py-10 text-center"
  >
    <CircleAlert size={28} aria-hidden="true" className="text-rose-400" />
    <p className="text-[14px] font-semibold text-rose-600">{message}</p>
    <button
      type="button"
      onClick={() => onRetry()}
      disabled={isRetrying}
      className={`inline-flex h-10 items-center gap-2 rounded-full border border-rose-200 bg-white px-5 text-[13px] font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-60 transition-colors ${FOCUS_RING}`}
    >
      <RefreshCw size={15} aria-hidden="true" className={isRetrying ? "animate-spin" : ""} />
      {isRetrying ? "Retrying…" : "Try again"}
    </button>
  </div>
);

export default SectionError;
