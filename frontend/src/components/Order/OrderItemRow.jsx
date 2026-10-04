import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import OrderThumb from "./OrderThumb";
import { ItemStatusPill } from "./OrderPills";
import { FOCUS_RING } from "../../constants/customerTheme";
import { formatPrice } from "../../utils/product";
import { formatDate } from "../../utils/date";
import { cancelReasonLabel } from "../../utils/order";

const ACTION = `inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-[12.5px] font-bold transition-colors ${FOCUS_RING}`;

const meta = (item) => [item.size && `Size ${item.size}`, item.pieces && `${item.pieces} pcs`].filter(Boolean).join(" · ");

// What happened to this line: cancellation, return request and the store's decision
const ItemDetails = ({ item }) => {
  const { cancellation, return: ret } = item;

  if (item.status === "cancelled" && cancellation) {
    return (
      <p className="text-[12.5px] text-slate-500">
        Cancelled {cancellation.cancelledBy === "admin" ? "by Care N Safe" : "by you"} on {formatDate(cancellation.at)} ·{" "}
        {cancelReasonLabel(cancellation.reason)}
        {cancellation.note && <span className="block break-words text-slate-600">“{cancellation.note}”</span>}
      </p>
    );
  }
  if (!ret?.requestedAt) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[12.5px] text-slate-500">
        Return requested on {formatDate(ret.requestedAt)} · Size mismatch
        {ret.note && <span className="block break-words text-slate-600">“{ret.note}”</span>}
      </p>
      {item.status === "return_rejected" && (
        <p className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12.5px] text-rose-700">
          <XCircle size={15} aria-hidden="true" className="mt-0.5 flex-shrink-0" />
          <span className="min-w-0 break-words">
            <span className="font-bold">Return rejected{ret.decidedAt ? ` on ${formatDate(ret.decidedAt)}` : ""}.</span> {ret.adminReason}
          </span>
        </p>
      )}
      {item.status === "return_approved" && (
        <p className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-800">
          <CheckCircle2 size={15} aria-hidden="true" className="mt-0.5 flex-shrink-0" />
          <span className="min-w-0 break-words">
            <span className="font-bold">Return approved.</span> Ship the unopened pack back in its original packaging; we&apos;ll
            confirm once it arrives.
            {ret.adminReason && <span className="block">Note from us: {ret.adminReason}</span>}
          </span>
        </p>
      )}
      {item.status === "returned" && (
        <p className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12.5px] text-slate-700">
          <CheckCircle2 size={15} aria-hidden="true" className="mt-0.5 flex-shrink-0" />
          <span>
            Pack received{ret.receivedAt ? ` on ${formatDate(ret.receivedAt)}` : ""}. Your refund of {formatPrice(item.lineTotal)} is being
            processed.
          </span>
        </p>
      )}
    </div>
  );
};

/** One ordered variant. Cancel / Return buttons appear only when the API allows them (item.canCancel / canReturn). */
const OrderItemRow = ({ item, onCancel, onReturn }) => {
  const details = meta(item);
  const isCancelled = item.status === "cancelled";

  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
      <div className="flex gap-3">
        <OrderThumb image={item.image} className={`h-16 w-16 ${isCancelled ? "opacity-50" : ""}`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <p className={`line-clamp-2 text-[14px] font-semibold leading-snug ${isCancelled ? "text-slate-400 line-through" : "text-[#1e1a3a]"}`}>
              {item.name}
            </p>
            <p className="flex-shrink-0 text-[14px] font-bold text-[#1e1a3a]">{formatPrice(item.lineTotal)}</p>
          </div>
          {details && <p className="mt-0.5 text-[12px] text-slate-500">{details}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-slate-500">
              {item.quantity} × {formatPrice(item.price)}
            </span>
            <ItemStatusPill status={item.status} />
          </div>
        </div>
      </div>

      <ItemDetails item={item} />

      {(item.canCancel || item.canReturn) && (
        <div className="flex flex-wrap gap-2">
          {item.canCancel && (
            <button type="button" onClick={() => onCancel(item)} className={`${ACTION} border-rose-200 bg-white text-rose-600 hover:bg-rose-50`}>
              <XCircle size={14} aria-hidden="true" />
              Cancel item
            </button>
          )}
          {item.canReturn && (
            <button type="button" onClick={() => onReturn(item)} className={`${ACTION} border-amber-200 bg-white text-amber-700 hover:bg-amber-50`}>
              <RotateCcw size={14} aria-hidden="true" />
              Return item
            </button>
          )}
        </div>
      )}
    </li>
  );
};

export default OrderItemRow;
