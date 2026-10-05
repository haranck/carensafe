import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { X } from "lucide-react";
import { FOCUS_RING } from "../../constants/customerTheme";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Full class strings per size (no dynamic Tailwind names)
const SIZES = {
  md: "sm:max-w-[440px]",
  lg: "sm:max-w-[640px]",
};

const ModalPanel = ({ title, description, size, onClose, children }) => {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef(null);

  // Focus the first field (else the close button), lock page scroll, give focus back to the trigger on close
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const fields = panelRef.current?.querySelectorAll("input, select, textarea");
    (fields?.[0] || panelRef.current?.querySelector(FOCUSABLE))?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  // Esc closes; Tab stays inside the dialog
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const focusable = [...panelRef.current.querySelectorAll(FOCUSABLE)];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4">
      <m.div
        aria-hidden="true"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-[#1e1a3a]/45 backdrop-blur-sm"
      />
      <m.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onKeyDown={handleKeyDown}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${SIZES[size] || SIZES.md}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[18px] font-extrabold text-[#1e1a3a]">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-0.5 text-[13px] text-slate-500">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`-mr-2 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-[#fff5fa] hover:text-[#d6008a] transition-colors ${FOCUS_RING}`}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </m.div>
    </div>
  );
};

/**
 * Customer-theme dialog (bottom sheet on phones, centred card from sm). Controlled: the caller owns `open`.
 * Esc, the backdrop and the X call `onClose` (pass a no-op while saving to keep it open). size: "md" | "lg".
 */
const Modal = ({ open, title, description, size = "md", onClose, children }) =>
  createPortal(
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence>
        {open && (
          <ModalPanel key="modal" title={title} description={description} size={size} onClose={onClose}>
            {children}
          </ModalPanel>
        )}
      </AnimatePresence>
    </LazyMotion>,
    document.body
  );

export default Modal;
