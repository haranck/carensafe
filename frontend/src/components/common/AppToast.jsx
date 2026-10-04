import { resolveValue, toast } from "react-hot-toast";
import { Check, Loader2, Sparkles, X } from "lucide-react";

// Per type: solid icon badge (+ soft halo), a short title and the colour of the time-left bar.
// Custom toasts (toast("…", { icon })) get the brand gradient and no title.
const TYPES = {
  success: {
    Icon: Check,
    badge: "bg-gradient-to-br from-emerald-400 to-emerald-600 ring-emerald-50",
    title: "Done",
    titleColor: "text-emerald-600",
    bar: "bg-gradient-to-r from-emerald-400 to-emerald-500",
  },
  error: {
    Icon: X,
    badge: "bg-gradient-to-br from-rose-400 to-rose-600 ring-rose-50",
    title: "Oops",
    titleColor: "text-rose-600",
    bar: "bg-gradient-to-r from-rose-400 to-rose-500",
  },
  loading: {
    Icon: Loader2,
    spin: true,
    badge: "bg-gradient-to-br from-violet-400 to-violet-600 ring-violet-50",
    title: "Just a moment",
    titleColor: "text-violet-600",
    bar: null,
  },
  blank: {
    Icon: Sparkles,
    badge: "bg-gradient-to-br from-[#7c3aed] to-[#d6008a] ring-pink-50",
    title: null,
    bar: "bg-gradient-to-r from-[#7c3aed] to-[#d6008a]",
  },
};

// The bar's animation length must be a full class string (Tailwind can't see built names); others use 3s
const BAR_DURATIONS = {
  2500: "[animation-duration:2500ms]",
  3000: "[animation-duration:3000ms]",
  4500: "[animation-duration:4500ms]",
  5000: "[animation-duration:5000ms]",
};

/**
 * Every toast in the app (rendered by <Toaster> in App.jsx): a white card with a coloured icon badge, a short title
 * for success / error / loading, the message, a dismiss button and a bar along the bottom that shows the time left
 * (pauses while hovered). Works with toast.success / error / loading, custom icons and message functions
 * (e.g. the Undo / View cart toasts). Slides in from above (@starting-style); no movement with reduced motion.
 */
const AppToast = ({ t }) => {
  const type = TYPES[t.type] || TYPES.blank;
  const showBar = type.bar && Number.isFinite(t.duration);

  return (
    <div
      {...t.ariaProps}
      className={`group relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-pink-100/80 bg-white font-sans shadow-[0_18px_40px_-14px_rgba(59,42,138,0.35)] transition-[opacity,translate,scale] duration-200 ease-out starting:-translate-y-3 starting:scale-95 starting:opacity-0 motion-reduce:transition-none ${
        t.visible ? "translate-y-0 scale-100 opacity-100" : "-translate-y-3 scale-95 opacity-0"
      }`}
    >
      <div className="flex items-center gap-3 py-3 pr-2 pl-3.5">
        <span
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white ring-4 shadow-sm ${type.badge}`}
        >
          {t.icon && t.type === "blank" ? (
            t.icon
          ) : (
            <type.Icon size={18} strokeWidth={2.8} aria-hidden="true" className={type.spin ? "animate-spin" : ""} />
          )}
        </span>

        <div className="min-w-0 flex-1">
          {type.title && (
            <p className={`text-[11.5px] font-extrabold tracking-wide uppercase ${type.titleColor}`}>{type.title}</p>
          )}
          <div className="text-[13.5px] font-semibold leading-snug break-words text-[#1e1a3a]">
            {resolveValue(t.message, t)}
          </div>
        </div>

        {t.type !== "loading" && (
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            aria-label="Dismiss notification"
            className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-pink-50 hover:text-[#d6008a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6008a]/30"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {showBar && (
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-slate-100">
          <span
            key={t.createdAt}
            className={`block h-full origin-left animate-toast-progress group-hover:[animation-play-state:paused] motion-reduce:animate-none ${type.bar} ${
              BAR_DURATIONS[t.duration] || BAR_DURATIONS[3000]
            }`}
          />
        </span>
      )}
    </div>
  );
};

export default AppToast;
