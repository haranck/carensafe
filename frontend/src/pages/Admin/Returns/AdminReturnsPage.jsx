import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Loader2, RotateCcw } from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import OrderThumb from "../../../components/Order/OrderThumb";
import { ItemStatusPill } from "../../../components/Order/OrderPills";
import { ADMIN_CARD } from "../../../components/Admin/Orders/adminOrderStyles";
import { useGetAdminReturnItems } from "../../../hooks/Admin/OrderHooks";
import { adminOrderDetailPath } from "../../../constants/frontendRoutes";
import { formatPrice } from "../../../utils/product";
import { formatDate } from "../../../utils/date";
import { usePageTitle } from "../../../hooks/common/usePageTitle";

const PAGE_SIZE = 10;

const customerName = (row) =>
  [row.customer?.firstName, row.customer?.lastName].filter(Boolean).join(" ") || row.shippingName || "Customer";

// Every item with an open return (requested, or approved and waiting for the pack), newest request first
const AdminReturnsPage = () => {
  usePageTitle("Admin · Returns");
  const [page, setPage] = useState(1);
  const { data: response, isLoading, isError, isFetching, refetch } = useGetAdminReturnItems(page, PAGE_SIZE);
  const rows = response?.data || [];
  const pagination = response?.pagination || { total: 0, totalPages: 1 };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-slate-800">Returns</h1>
      <p className="mb-6 mt-1 text-[13.5px] text-slate-500">Return requests waiting for a decision, and approved returns waiting for the pack.</p>

      <div className={`${ADMIN_CARD} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm text-slate-600">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[12px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Requested</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12">
                    <div className="flex justify-center">
                      <Loader2 size={30} aria-label="Loading returns" className="animate-spin text-indigo-600" />
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <p className="font-bold text-rose-500">Failed to load return requests.</p>
                    <button type="button" onClick={() => refetch()} disabled={isFetching} className="mt-2 text-[13px] font-bold text-indigo-600 hover:underline">
                      {isFetching ? "Retrying…" : "Try again"}
                    </button>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-14 text-center text-slate-500">
                    <RotateCcw size={36} strokeWidth={1.6} aria-hidden="true" className="mx-auto mb-3 text-slate-300" />
                    <p className="font-bold text-slate-700">No open returns</p>
                    <p className="text-[13px]">New return requests will show up here.</p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={`${row.orderId}-${row.item._id}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <OrderThumb image={row.item.image} className="h-11 w-11" />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800">{row.item.name}</p>
                          <p className="text-[12px] text-slate-500">
                            Qty {row.item.quantity}
                            {row.item.return?.note && ` · “${row.item.return.note}”`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800 whitespace-nowrap">{row.orderNumber}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{customerName(row)}</p>
                      {row.customer?.email && <p className="text-[12px] text-slate-500">{row.customer.email}</p>}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap">{formatPrice(row.item.lineTotal)}</td>
                    <td className="px-6 py-4">
                      <ItemStatusPill status={row.item.status} />
                    </td>
                    <td className="px-6 py-4 text-[13px] whitespace-nowrap">{formatDate(row.item.return?.requestedAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={adminOrderDetailPath(row.orderId)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-[12px] font-bold text-indigo-600 hover:bg-indigo-100"
                      >
                        <Eye size={14} aria-hidden="true" /> Review
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isLoading && rows.length > 0 && (
        <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} totalItems={pagination.total} itemsPerPage={PAGE_SIZE} />
      )}
    </div>
  );
};

export default AdminReturnsPage;
