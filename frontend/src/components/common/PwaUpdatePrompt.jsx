import { useRegisterSW } from "virtual:pwa-register/react";
import toast from "react-hot-toast";
import { RefreshCw, X } from "lucide-react";
import { BRAND_GRADIENT, FOCUS_RING } from "../../constants/customerTheme";

// An open app also looks for a new deploy once an hour (besides on every page load)
const UPDATE_CHECK_MS = 60 * 60 * 1000;

/**
 * Registers the service worker (production builds only; vite-plugin-pwa, registerType "prompt").
 * - First install: one "ready to work offline" toast.
 * - New deploy waiting: a small banner above the bottom tab bar; Refresh activates it and reloads, Later hides it
 *   until the next load.
 */
const PwaUpdatePrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onOfflineReady: () => toast.success("App ready to work offline", { id: "pwa-offline-ready" }),
    onRegisteredSW: (swUrl, registration) => {
      if (registration) setInterval(() => registration.update(), UPDATE_CHECK_MS);
    },
    onRegisterError: (error) => console.error("Service worker registration failed", error),
  });

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-[120] flex justify-center px-4 lg:bottom-6"
    >
      <div className="flex w-full max-w-[420px] items-center gap-3 rounded-2xl border border-pink-100 bg-white px-4 py-3 shadow-[0_12px_32px_-12px_rgba(59,42,138,0.35)]">
        <p className="flex-1 text-[14px] font-semibold text-[#1e1a3a]">New version available</p>
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className={`inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-bold text-white ${BRAND_GRADIENT} hover:brightness-110 ${FOCUS_RING}`}
        >
          <RefreshCw size={15} aria-hidden="true" />
          Refresh
        </button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          aria-label="Later"
          title="Later"
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 ${FOCUS_RING}`}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default PwaUpdatePrompt;
