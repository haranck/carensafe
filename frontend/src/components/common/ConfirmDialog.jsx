import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";

// Full class strings per tone (danger: block / deactivate / remove, primary: unblock / activate)
const TONES = {
  danger: {
    icon: "bg-rose-50 text-rose-600",
    button: "bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500/40",
  },
  primary: {
    icon: "bg-indigo-50 text-indigo-600",
    button: "bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-indigo-500/40",
  },
};

const DialogPanel = ({ title, description, confirmLabel, cancelLabel, tone, Icon, isPending, onConfirm, onCancel }) => {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef(null);
  const cancelRef = useRef(null);
  const styles = TONES[tone] || TONES.danger;

  // Focus Cancel (the safe choice), lock page scroll, give focus back to the trigger on close
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  // Esc cancels; Tab stays inside the dialog
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      if (!isPending) onCancel();
      return;
    }
    if (e.key !== "Tab") return;
    const buttons = [...panelRef.current.querySelectorAll("button:not([disabled])")];
    if (buttons.length === 0) {
      e.preventDefault();
      return;
    }
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center">
      <m.div
        aria-hidden="true"
        onClick={isPending ? undefined : onCancel}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
      />
      <m.div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onKeyDown={handleKeyDown}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative w-full max-w-[420px] rounded-2xl border border-slate-100 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start gap-4">
          <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${styles.icon}`}>
            <Icon size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="text-[17px] font-bold leading-snug text-slate-800 break-words">
              {title}
            </h2>
            <p id={descriptionId} className="mt-1.5 text-[14px] leading-relaxed text-slate-500">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[14px] font-bold text-white disabled:cursor-wait disabled:opacity-80 transition-colors focus-visible:outline-none focus-visible:ring-2 ${styles.button}`}
          >
            {isPending && <Loader2 size={16} aria-hidden="true" className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </m.div>
    </div>
  );
};

/**
 * Asks before an action that changes saved data (block / unblock, activate / deactivate, remove).
 * Controlled: the caller owns `open`. While `isPending` it stays open with a spinner and can't be dismissed,
 * so close it from the mutation's onSettled. Esc, the backdrop and Cancel call `onCancel`.
 * tone: "danger" (rose) or "primary" (indigo).
 */
const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  icon: Icon = AlertTriangle,
  isPending = false,
  onConfirm,
  onCancel,
}) =>
  createPortal(
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence>
        {open && (
          <DialogPanel
            key="confirm-dialog"
            title={title}
            description={description}
            confirmLabel={confirmLabel}
            cancelLabel={cancelLabel}
            tone={tone}
            Icon={Icon}
            isPending={isPending}
            onConfirm={onConfirm}
            onCancel={onCancel}
          />
        )}
      </AnimatePresence>
    </LazyMotion>,
    document.body
  );

export default ConfirmDialog;
