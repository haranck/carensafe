import { Check, PackageCheck, X } from "lucide-react";
import OrderThumb from "../../Order/OrderThumb";
import { ItemStatusPill } from "../../Order/OrderPills";
import { formatPrice } from "../../../utils/product";
import { formatDate } from "../../../utils/date";
import { cancelReasonLabel } from "../../../utils/order";
import { ADMIN_CARD } from "./adminOrderStyles";

const SMALL_BUTTON = "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-bold transition-colors disabled:opacity-50";

// Cancellation / return details for one line
const ItemNotes = ({ item }) => {
  const { cancellation, return: ret } = item;
  if (item.status === "cancelled" && cancellation) {
    return (
      <p className="mt-1 text-[12px] text-slate-500">
        Cancelled by {cancellation.cancelledBy === "admin" ? "admin" : "customer"} on {formatDate(cancellation.at)} ·{" "}
        {cancelReasonLabel(cancellation.reason)}
        {cancellation.note && ` · “${cancellation.note}”`}
      </p>
    );
  }
  if (!ret?.requestedAt) return null;
  return (
    <div className="mt-1 flex flex-col gap-0.5 text-[12px] text-slate-500">
      <p>
        Return requested {formatDate(ret.requestedAt)} · Size mismatch · Unopened confirmed
        {ret.note && ` · “${ret.note}”`}
      </p>
      {ret.decidedAt && (
        <p className={ret.decision === "rejected" ? "text-rose-600" : "text-emerald-700"}>
          {ret.decision === "rejected" ? "Rejected" : "Approved"} {formatDate(ret.decidedAt)}
          {ret.adminReason && ` · ${ret.adminReason}`}
        </p>
      )}
      {ret.receivedAt && <p className="text-slate-700">Received {formatDate(ret.receivedAt)} · restocked</p>}
    </div>
  );
};

/** Items with their status and return actions: Approve / Reject a request, Mark as received once approved. */
const AdminOrderItems = ({ items, onDecide, onReceived, receivingItemId }) => (
  <section className={`${ADMIN_CARD} overflow-hidden`}>
    <h2 className="px-5 pt-5 text-[16px] font-bold text-slate-800">Items</h2>
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm text-slate-600">
        <thead className="border-b border-slate-100 bg-slate-50/80 text-[12px] font-bold uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-5 py-3">Item</th>
            <th className="px-5 py-3">Qty × Price</th>
            <th className="px-5 py-3">Total</th>
            <th className="px-5 py-3 text-right">Return</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((item) => (
            <tr key={item._id} className="align-top">
              <td className="px-5 py-4">
                <div className="flex gap-3">
                  <OrderThumb image={item.image} className="h-12 w-12" />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800">{item.name}</p>
                    <p className="text-[12px] text-slate-500">{[item.size && `Size ${item.size}`, item.pieces && `${item.pieces} pcs`].filter(Boolean).join(" · ")}</p>
                    <div className="mt-1">
                      <ItemStatusPill status={item.status} />
                    </div>
                    <ItemNotes item={item} />
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 whitespace-nowrap">
                {item.quantity} × {formatPrice(item.price)}
              </td>
              <td className="px-5 py-4 font-bold text-slate-800 whitespace-nowrap">{formatPrice(item.lineTotal)}</td>
              <td className="px-5 py-4">
                <div className="flex flex-wrap justify-end gap-1.5">
                  {item.status === "return_requested" && (
                    <>
                      <button type="button" onClick={() => onDecide(item, "approved")} className={`${SMALL_BUTTON} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}>
                        <Check size={14} aria-hidden="true" /> Approve
                      </button>
                      <button type="button" onClick={() => onDecide(item, "rejected")} className={`${SMALL_BUTTON} bg-rose-50 text-rose-600 hover:bg-rose-100`}>
                        <X size={14} aria-hidden="true" /> Reject
                      </button>
                    </>
                  )}
                  {item.status === "return_approved" && (
                    <button
                      type="button"
                      onClick={() => onReceived(item)}
                      disabled={receivingItemId === item._id}
                      className={`${SMALL_BUTTON} bg-indigo-50 text-indigo-700 hover:bg-indigo-100`}
                    >
                      <PackageCheck size={14} aria-hidden="true" /> Mark as received
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export default AdminOrderItems;
