import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Loader2, PackageSearch, Search } from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import OrderStatCards from "../../../components/Admin/Orders/OrderStatCards";
import { OrderStatusPill, PaymentStatusPill } from "../../../components/Order/OrderPills";
import { ADMIN_CARD, ADMIN_INPUT, ADMIN_LABEL } from "../../../components/Admin/Orders/adminOrderStyles";
import { useGetAdminOrderStats, useGetAdminOrders } from "../../../hooks/Admin/OrderHooks";
import { adminOrderDetailPath } from "../../../constants/frontendRoutes";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, formatDateTime } from "../../../utils/order";
import { formatPrice } from "../../../utils/product";
import { usePageTitle } from "../../../hooks/common/usePageTitle";

const PAGE_SIZE = 10;
const EMPTY_FILTERS = { orderStatus: "", paymentStatus: "", from: "", to: "", hasReturnRequest: false };

const customerName = (order) =>
  [order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ") || order.shippingAddress?.fullName || "Customer";

const AdminOrdersPage = () => {
  usePageTitle("Admin · Orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  // Debounce search 400ms, back to page 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const setFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(1);
  };

  const query = {
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch,
    ...filters,
    hasReturnRequest: filters.hasReturnRequest ? "true" : "",
  };
  const { data: response, isLoading, isError, isFetching, refetch } = useGetAdminOrders(query);
  const { data: statsResponse, isLoading: isLoadingStats } = useGetAdminOrderStats();
  const orders = response?.data || [];
  const pagination = response?.pagination || { total: 0, totalPages: 1 };
  const hasFilters = debouncedSearch || Object.entries(filters).some(([, value]) => value);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-800">Orders</h1>

      <OrderStatCards stats={statsResponse?.data} isLoading={isLoadingStats} />

      <div className={`${ADMIN_CARD} mt-6 p-4`}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="order-search" className={ADMIN_LABEL}>
              Search
            </label>
            <div className="relative">
              <input
                id="order-search"
                type="search"
                placeholder="Order no., name, email or phone"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${ADMIN_INPUT} pl-10`}
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="order-status" className={ADMIN_LABEL}>
              Order status
            </label>
            <select id="order-status" value={filters.orderStatus} onChange={(e) => setFilter("orderStatus", e.target.value)} className={ADMIN_INPUT}>
              <option value="">All</option>
              {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="payment-status" className={ADMIN_LABEL}>
              Payment
            </label>
            <select id="payment-status" value={filters.paymentStatus} onChange={(e) => setFilter("paymentStatus", e.target.value)} className={ADMIN_INPUT}>
              <option value="">All</option>
              {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="order-from" className={ADMIN_LABEL}>
              From
            </label>
            <input id="order-from" type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => setFilter("from", e.target.value)} className={ADMIN_INPUT} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="order-to" className={ADMIN_LABEL}>
              To
            </label>
            <input id="order-to" type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => setFilter("to", e.target.value)} className={ADMIN_INPUT} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-[13.5px] font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={filters.hasReturnRequest}
              onChange={(e) => setFilter("hasReturnRequest", e.target.checked)}
              className="h-4 w-4 accent-indigo-600"
            />
            Has return request
          </label>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setFilters(EMPTY_FILTERS);
                setSearchTerm("");
                setPage(1);
              }}
              className="inline-flex h-10 items-center rounded-xl px-3 text-[13px] font-bold text-indigo-600 hover:bg-indigo-50"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className={`${ADMIN_CARD} mt-4 overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm text-slate-600">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[12px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12">
                    <div className="flex justify-center">
                      <Loader2 size={30} aria-label="Loading orders" className="animate-spin text-indigo-600" />
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center">
                    <p className="font-bold text-rose-500">Failed to load orders.</p>
                    <button type="button" onClick={() => refetch()} disabled={isFetching} className="mt-2 text-[13px] font-bold text-indigo-600 hover:underline">
                      {isFetching ? "Retrying…" : "Try again"}
                    </button>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-14 text-center text-slate-500">
                    <PackageSearch size={36} strokeWidth={1.6} aria-hidden="true" className="mx-auto mb-3 text-slate-300" />
                    <p className="font-bold text-slate-700">{hasFilters ? "No orders match these filters" : "No orders yet"}</p>
                    <p className="text-[13px]">{hasFilters ? "Try clearing a filter or the search." : "New orders will show up here."}</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className={`hover:bg-slate-50/50 transition-colors ${isFetching ? "opacity-70" : ""}`}>
                    <td className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap">{order.orderNumber}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{customerName(order)}</p>
                      <p className="text-[12px] text-slate-500">{order.user?.email || order.shippingAddress?.phone}</p>
                    </td>
                    <td className="px-6 py-4">{order.items.length}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap">{formatPrice(order.pricing.total)}</td>
                    <td className="px-6 py-4">
                      <PaymentStatusPill order={order} />
                    </td>
                    <td className="px-6 py-4">
                      <OrderStatusPill status={order.orderStatus} />
                    </td>
                    <td className="px-6 py-4 text-[13px] whitespace-nowrap">{formatDateTime(order.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={adminOrderDetailPath(order._id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-[12px] font-bold text-indigo-600 hover:bg-indigo-100"
                      >
                        <Eye size={14} aria-hidden="true" /> View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isLoading && orders.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          totalItems={pagination.total}
          itemsPerPage={PAGE_SIZE}
        />
      )}
    </div>
  );
};

export default AdminOrdersPage;
