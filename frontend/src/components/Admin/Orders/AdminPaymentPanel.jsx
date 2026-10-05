import { CreditCard } from "lucide-react";
import { ADMIN_CARD } from "./adminOrderStyles";
import { formatPaise } from "../../../utils/wallet";
import { formatDateTime } from "../../../utils/order";

// Full class strings per state
const STATUS_STYLES = {
  captured: "bg-emerald-50 text-emerald-700",
  processed: "bg-emerald-50 text-emerald-700",
  refunded: "bg-slate-100 text-slate-700",
  partially_refunded: "bg-slate-100 text-slate-700",
  failed: "bg-rose-50 text-rose-600",
  expired: "bg-rose-50 text-rose-600",
  mismatch: "bg-rose-50 text-rose-600",
  signature_mismatch: "bg-rose-50 text-rose-600",
  refunded_in_full: "bg-amber-50 text-amber-700",
  queued: "bg-amber-50 text-amber-700",
  processing: "bg-amber-50 text-amber-700",
  pending: "bg-amber-50 text-amber-700",
};
const Pill = ({ value }) => (
  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLES[value] || "bg-slate-100 text-slate-600"}`}>{String(value).replace(/_/g, " ")}</span>
);

const Mono = ({ children }) => <span className="break-all font-mono text-[12px] text-slate-700">{children}</span>;

/** Razorpay audit trail of an order: each Payment with its attempts (and why they failed) and refunds. */
const AdminPaymentPanel = ({ order }) => {
  const payments = order.payments || [];
  const split = order.payment || {};
  if (payments.length === 0 && !split.walletPaise) return null;

  return (
    <section className={`${ADMIN_CARD} p-5`}>
      <h2 className="flex items-center gap-2 text-[16px] font-bold text-slate-800">
        <CreditCard size={17} aria-hidden="true" className="text-indigo-600" /> Online payment
      </h2>
      {(split.walletPaise > 0 || split.onlinePaise > 0) && (
        <p className="mt-2 text-[13px] text-slate-600">
          Wallet {formatPaise(split.walletPaise || 0)} · Online {formatPaise(split.onlinePaise || 0)}
          {(split.refundedWalletPaise > 0 || split.refundedOnlinePaise > 0) &&
            ` · Refunded: wallet ${formatPaise(split.refundedWalletPaise || 0)}, online ${formatPaise(split.refundedOnlinePaise || 0)}`}
        </p>
      )}

      {payments.map((payment) => (
        <div key={payment._id} className="mt-4 rounded-xl border border-slate-100 p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-bold text-slate-800">{formatPaise(payment.amount)}</span>
            <Pill value={payment.status} />
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${payment.mode === "live" ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"}`}
            >
              {payment.mode}
            </span>
            {payment.method && <span className="text-[12px] font-semibold capitalize text-slate-500">{payment.method}</span>}
          </div>
          <dl className="mt-2 grid gap-1 text-[12.5px] text-slate-500">
            <div>
              Order <Mono>{payment.razorpayOrderId}</Mono>
            </div>
            {payment.razorpayPaymentId && (
              <div>
                Payment <Mono>{payment.razorpayPaymentId}</Mono>
              </div>
            )}
            {payment.capturedAt && <div>Captured {formatDateTime(payment.capturedAt)}</div>}
          </dl>

          {payment.attempts?.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Attempts</p>
              <ul className="mt-1 flex flex-col gap-1.5">
                {payment.attempts.map((attempt, index) => (
                  <li key={`${attempt.paymentId}-${index}`} className="text-[12px] text-slate-600">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <Pill value={attempt.status} />
                      {attempt.method && <span className="capitalize">{attempt.method}</span>}
                      <span className="text-slate-400">{formatDateTime(attempt.at)}</span>
                    </span>
                    {(attempt.errorDescription || attempt.errorReason) && (
                      <span className="mt-0.5 block text-rose-600">
                        {[attempt.errorReason, attempt.errorDescription].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {payment.refunds?.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Refunds</p>
              <ul className="mt-1 flex flex-col gap-1.5">
                {payment.refunds.map((refund) => (
                  <li key={refund.key} className="flex flex-wrap items-center gap-1.5 text-[12px] text-slate-600">
                    <span className="font-bold text-slate-800">{formatPaise(refund.amount)}</span>
                    <span>→ {refund.destination === "source" ? "original method" : "wallet"}</span>
                    <Pill value={refund.status} />
                    {refund.refundId && <Mono>{refund.refundId}</Mono>}
                    {refund.lastError && <span className="text-rose-600">{refund.lastError}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </section>
  );
};

export default AdminPaymentPanel;
