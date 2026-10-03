import { resolveValue, toast } from "react-hot-toast";
import { CheckCircle2, CircleAlert, Loader2, X } from "lucide-react";

// Type icon + its tinted circle (custom icons passed as toast("…", { icon }) get the pink circle)
const TYPE_ICONS = {
  success: { Icon: CheckCircle2, circle: "bg-emerald-400/15 text-emerald-300" },
  error: { Icon: CircleAlert, circle: "bg-rose-400/15 text-rose-300" },
  loading: { Icon: Loader2, circle: "bg-violet-400/15 text-violet-300", spin: true },
};
const CUSTOM_ICON_CIRCLE = "bg-pink-400/15 text-pink-300";

/**
 * Every toast in the app (rendered by <Toaster> in App.jsx): dark navy body inside a 1px brand-gradient border
 * (pink → violet → blue), an icon for the type, the message and a dismiss button. Keeps working with
 * toast.success / toast.error / toast.loading, custom icons and message functions (e.g. the wishlist Undo toast).
 * Slides in from above (@starting-style) and back up on dismiss; no movement with reduced motion.
 */
const AppToast = ({ t }) => {
  const preset = TYPE_ICONS[t.type];
  let icon = null;
  if (t.icon) {
    icon = <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${CUSTOM_ICON_CIRCLE}`}>{t.icon}</span>;
  } else if (preset) {
    icon = (
      <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${preset.circle}`}>
        <preset.Icon size={18} strokeWidth={2.4} aria-hidden="true" className={preset.spin ? "animate-spin" : ""} />
      </span>
    );
  }

  return (
    <div
      {...t.ariaProps}
      className={`w-full max-w-[420px] rounded-2xl bg-gradient-to-r from-[#d6008a] via-[#7c3aed] to-[#3b82f6] p-px shadow-[0_18px_40px_-14px_rgba(30,26,58,0.6)] transition-[opacity,translate] duration-200 ease-out starting:-translate-y-3 starting:opacity-0 motion-reduce:transition-none ${
        t.visible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
      }`}
    >
      <div className="flex items-center gap-3 rounded-[15px] bg-[#16122e] py-2.5 pr-1.5 pl-3 font-sans text-white">
        {icon}
        <div className="min-w-0 flex-1 py-1.5 text-[13.5px] font-medium leading-snug break-words text-white/95">
          {resolveValue(t.message, t)}
        </div>
        {t.type !== "loading" && (
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            aria-label="Dismiss notification"
            className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white/45 hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300/60"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AppToast;
