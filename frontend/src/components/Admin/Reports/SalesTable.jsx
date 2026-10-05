import { Link } from "react-router-dom";
import { Loader2, PackageSearch } from "lucide-react";
import { OrderStatusPill } from "../../Order/OrderPills";
import { adminOrderDetailPath } from "../../../constants/frontendRoutes";
import { formatDateTime } from "../../../utils/order";
import { PAYMENT_SHORT_LABELS, formatMoney } from "../../../utils/report";

const COLUMNS = 8;

// One row per delivered / partially returned order (rows from the sales report API)
const SalesTable = ({ rows, isLoading, isError, isFetching, onRetry }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[920px] text-left text-sm text-slate-600">
      <thead className="border-b border-slate-100 bg-slate-50/80 text-[12px] font-bold uppercase tracking-wider text-slate-500">
        <tr>
          <th className="px-5 py-3.5">Order</th>
          <th className="px-5 py-3.5">Delivered</th>
          <th className="px-5 py-3.5">Customer</th>
          <th className="px-5 py-3.5">Payment</th>
          <th className="px-5 py-3.5">Status</th>
          <th className="px-5 py-3.5 text-right">Total</th>
          <th className="px-5 py-3.5 text-right">Returned</th>
          <th className="px-5 py-3.5 text-right">Net</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {isLoading ? (
          <tr>
            <td colSpan={COLUMNS} className="px-5 py-12">
              <div className="flex justify-center">
                <Loader2 size={30} aria-label="Loading sales" className="animate-spin text-indigo-600" />
              </div>
            </td>
          </tr>
        ) : isError ? (
          <tr>
            <td colSpan={COLUMNS} className="px-5 py-8 text-center">
              <p className="font-bold text-rose-500">Failed to load sales.</p>
              <button type="button" onClick={onRetry} disabled={isFetching} className="mt-2 text-[13px] font-bold text-indigo-600 hover:underline">
                {isFetching ? "Retrying…" : "Try again"}
              </button>
            </td>
          </tr>
        ) : rows.length === 0 ? (
          <tr>
            <td colSpan={COLUMNS} className="px-5 py-14 text-center text-slate-500">
              <PackageSearch size={36} strokeWidth={1.6} aria-hidden="true" className="mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-slate-700">No sales in this period</p>
              <p className="text-[13px]">Delivered and partially returned orders show up here. Try a longer period.</p>
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row._id} className={`hover:bg-slate-50/50 transition-colors ${isFetching ? "opacity-70" : ""}`}>
              <td className="px-5 py-3.5 whitespace-nowrap">
                <Link to={adminOrderDetailPath(row._id)} className="font-bold text-slate-800 hover:text-indigo-600">
                  {row.orderNumber}
                </Link>
                <p className="text-[12px] text-slate-400">
                  {row.units} kept{row.unitsReturned ? ` · ${row.unitsReturned} returned` : ""}
                </p>
              </td>
              <td className="px-5 py-3.5 text-[13px] whitespace-nowrap">{formatDateTime(row.deliveredAt)}</td>
              <td className="px-5 py-3.5">
                <p className="font-semibold text-slate-800">{row.customer.name}</p>
                {row.customer.email && <p className="text-[12px] text-slate-500">{row.customer.email}</p>}
              </td>
              <td className="px-5 py-3.5 text-[13px]">{PAYMENT_SHORT_LABELS[row.paymentMethod] || row.paymentMethod}</td>
              <td className="px-5 py-3.5">
                <OrderStatusPill status={row.orderStatus} />
              </td>
              <td className="px-5 py-3.5 text-right whitespace-nowrap">{formatMoney(row.total)}</td>
              <td className={`px-5 py-3.5 text-right whitespace-nowrap ${row.returnedAmount ? "font-semibold text-orange-600" : "text-slate-400"}`}>
                {row.returnedAmount ? `−${formatMoney(row.returnedAmount)}` : "—"}
              </td>
              <td className="px-5 py-3.5 text-right font-bold text-slate-800 whitespace-nowrap">{formatMoney(row.net)}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default SalesTable;
