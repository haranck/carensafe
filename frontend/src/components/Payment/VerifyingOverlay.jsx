import { Loader2 } from "lucide-react";

// Full-screen "Confirming your payment…" while the server verifies a Razorpay payment
const VerifyingOverlay = ({ show }) =>
  show ? (
    <div role="status" aria-live="assertive" className="fixed inset-0 z-[300] flex items-center justify-center bg-[#1e1a3a]/40 px-4 backdrop-blur-sm">
      <div className="flex w-full max-w-[340px] flex-col items-center gap-3 rounded-3xl bg-white px-6 py-8 text-center shadow-2xl">
        <Loader2 size={36} aria-hidden="true" className="animate-spin text-[#d6008a]" />
        <p className="text-[17px] font-extrabold text-[#1e1a3a]">Confirming your payment…</p>
        <p className="text-[13px] text-slate-500">Please don&apos;t close or refresh this page.</p>
      </div>
    </div>
  ) : null;

export default VerifyingOverlay;
