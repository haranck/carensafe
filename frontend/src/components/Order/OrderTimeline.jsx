import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { FOCUS_RING } from "../../constants/customerTheme";
import { formatDateTime, historyLabel } from "../../utils/order";

const BY_LABELS = { user: "You", admin: "Care N Safe", system: "Care N Safe" };

/** Every status change with its note, newest first; collapsed by default. `byLabels` lets the admin view say "Customer". */
const OrderTimeline = ({ history = [], byLabels = BY_LABELS, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const listId = useId();
  const entries = [...history].reverse();

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={listId}
        className={`-ml-3 inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold text-[#d6008a] hover:bg-[#fff5fa] hover:text-[#9d0063] transition-colors ${FOCUS_RING}`}
      >
        {isOpen ? "Hide full history" : `Show full history (${entries.length})`}
        <ChevronDown size={16} aria-hidden="true" className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <ol id={listId} className="mt-2 flex flex-col">
          {entries.map((entry, index) => (
            <li key={`${entry.status}-${entry.at}-${index}`} className="relative flex gap-3 pb-4 last:pb-0">
              {index < entries.length - 1 && <span aria-hidden="true" className="absolute left-[5px] top-4 h-full w-px bg-slate-200" />}
              <span aria-hidden="true" className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${index === 0 ? "bg-[#d6008a]" : "bg-slate-300"}`} />
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-[#1e1a3a]">{historyLabel(entry.status)}</p>
                <p className="text-[12px] text-slate-500">
                  {formatDateTime(entry.at)} · {byLabels[entry.by] || entry.by}
                </p>
                {entry.note && <p className="mt-0.5 break-words text-[12.5px] text-slate-600">{entry.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default OrderTimeline;
