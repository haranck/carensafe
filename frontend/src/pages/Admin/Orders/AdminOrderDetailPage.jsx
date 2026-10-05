import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, Mail, MapPin, Phone, Truck, User, XCircle } from "lucide-react";
import AdminOrderItems from "../../../components/Admin/Orders/AdminOrderItems";
import AdminStatusPanel from "../../../components/Admin/Orders/AdminStatusPanel";
import AdminCancelOrderModal from "../../../components/Admin/Orders/AdminCancelOrderModal";
import AdminPaymentPanel from "../../../components/Admin/Orders/AdminPaymentPanel";
import ReturnDecisionModal from "../../../components/Admin/Orders/ReturnDecisionModal";
import OrderTimeline from "../../../components/Order/OrderTimeline";
import { OrderStatusPill, PaymentStatusPill } from "../../../components/Order/OrderPills";
import { ADMIN_CARD } from "../../../components/Admin/Orders/adminOrderStyles";
import { useGetAdminOrder, useMarkReturnReceived } from "../../../hooks/Admin/OrderHooks";
import { FRONTEND_ROUTES } from "../../../constants/frontendRoutes";
import { formatAddress } from "../../../utils/address";
import { formatPrice } from "../../../utils/product";
import { formatDate } from "../../../utils/date";
import { PAYMENT_METHOD_LABELS, formatDateTime } from "../../../utils/order";
import { getErrorMessage } from "../../../utils/errorMessage";
import { usePageTitle } from "../../../hooks/common/usePageTitle";

const ADMIN_BY_LABELS = { user: "Customer", admin: "Admin", system: "System" };

const Row = ({ label, children, strong = false }) => (
  <div className="flex justify-between gap-4 text-[13.5px]">
    <dt className="text-slate-500">{label}</dt>
    <dd className={strong ? "font-extrabold text-slate-800" : "font-semibold text-slate-700"}>{children}</dd>
  </div>
);

const AdminOrderDetailPage = () => {
  const { id } = useParams();
  const { data, isLoading, isError, isFetching, refetch } = useGetAdminOrder(id);
  const markReceived = useMarkReturnReceived();
  const order = data?.data;
  usePageTitle(order ? `Admin · Order ${order.orderNumber}` : "Admin · Order");
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  // { open, item, decision }; item kept while closing so the modal text doesn't jump
  const [decision, setDecision] = useState({ open: false, item: null, decision: "approved" });

  const handleReceived = (item) =>
    markReceived.mutate(
      { id: order._id, itemId: item._id },
      {
        onSuccess: () => toast.success(`${item.name}: return received and restocked`),
        onError: (error) => toast.error(getErrorMessage(error, "Couldn't mark the return as received.")),
      }
    );

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={32} aria-label="Loading order" className="animate-spin text-indigo-600" />
      </div>
    );
  }
  if (isError || !order) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className={`${ADMIN_CARD} p-8 text-center`}>
          <p className="font-bold text-rose-500">Couldn&apos;t load this order.</p>
          <button type="button" onClick={() => refetch()} disabled={isFetching} className="mt-2 text-[13px] font-bold text-indigo-600 hover:underline">
            {isFetching ? "Retrying…" : "Try again"}
          </button>
        </div>
      </div>
    );
  }

  const { pricing, shippingAddress: address, user: customer, tracking } = order;
  const customerName = [customer?.firstName, customer?.lastName].filter(Boolean).join(" ");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Link to={FRONTEND_ROUTES.ADMIN_ORDERS} className="mb-4 inline-flex min-h-10 items-center gap-1.5 text-[13px] font-bold text-slate-500 hover:text-indigo-600">
        <ArrowLeft size={16} aria-hidden="true" /> All orders
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Order {order.orderNumber}</h1>
          <p className="mt-1 text-[13px] text-slate-500">Placed {formatDateTime(order.createdAt)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <OrderStatusPill status={order.orderStatus} />
            <PaymentStatusPill order={order} />
          </div>
        </div>
        {order.canCancel && (
          <button
            type="button"
            onClick={() => setIsCancelOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-[14px] font-bold text-rose-600 hover:bg-rose-50"
          >
            <XCircle size={16} aria-hidden="true" /> Cancel order
          </button>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          <AdminOrderItems
            items={order.items}
            paymentMethod={order.paymentMethod}
            onDecide={(item, value) => setDecision({ open: true, item, decision: value })}
            onReceived={handleReceived}
            receivingItemId={markReceived.isPending ? markReceived.variables?.itemId : null}
          />

          <section className={`${ADMIN_CARD} p-5`}>
            <h2 className="text-[16px] font-bold text-slate-800">History</h2>
            <div className="mt-2">
              <OrderTimeline history={order.statusHistory} byLabels={ADMIN_BY_LABELS} defaultOpen />
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className={`${ADMIN_CARD} p-5`}>
            <h2 className="text-[16px] font-bold text-slate-800">Customer</h2>
            <ul className="mt-3 flex flex-col gap-1.5 text-[13.5px] text-slate-600">
              <li className="flex items-center gap-2">
                <User size={15} aria-hidden="true" className="text-slate-400" />
                {customerName || "Deleted account"}
              </li>
              {customer?.email && (
                <li className="flex min-w-0 items-center gap-2">
                  <Mail size={15} aria-hidden="true" className="flex-shrink-0 text-slate-400" />
                  <span className="truncate">{customer.email}</span>
                </li>
              )}
              {customer?.phone && (
                <li className="flex items-center gap-2">
                  <Phone size={15} aria-hidden="true" className="text-slate-400" />
                  {customer.phone}
                </li>
              )}
            </ul>
            <h3 className="mt-4 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">
              <MapPin size={14} aria-hidden="true" /> Delivery address
            </h3>
            <p className="mt-1.5 text-[13.5px] font-bold text-slate-800">
              {address.fullName} · {address.phone}
            </p>
            <p className="break-words text-[13px] leading-relaxed text-slate-600">{formatAddress(address)}</p>
          </section>

          <AdminStatusPanel order={order} />

          <AdminPaymentPanel order={order} />

          {tracking?.courier && (
            <section className={`${ADMIN_CARD} p-5`}>
              <h2 className="flex items-center gap-2 text-[16px] font-bold text-slate-800">
                <Truck size={17} aria-hidden="true" className="text-indigo-600" /> Tracking
              </h2>
              <dl className="mt-3 flex flex-col gap-1.5">
                <Row label="Courier">{tracking.courier}</Row>
                <Row label="Tracking no.">{tracking.trackingNumber}</Row>
                {tracking.expectedDelivery && <Row label="Expected">{formatDate(tracking.expectedDelivery)}</Row>}
              </dl>
              {tracking.trackingUrl && (
                <a href={tracking.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[13px] font-bold text-indigo-600 hover:underline">
                  Open tracking link
                </a>
              )}
            </section>
          )}

          <section className={`${ADMIN_CARD} p-5`}>
            <h2 className="text-[16px] font-bold text-slate-800">Payment</h2>
            <dl className="mt-3 flex flex-col gap-1.5">
              <Row label="Method">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</Row>
              <Row label="Subtotal">{formatPrice(pricing.subtotal)}</Row>
              <Row label="Discount">{formatPrice(pricing.discount)}</Row>
              <Row label="Shipping">{pricing.shipping === 0 ? "FREE" : formatPrice(pricing.shipping)}</Row>
              <div className="my-1 border-t border-slate-100" />
              <Row label="Total" strong>
                {formatPrice(pricing.total)}
              </Row>
              {pricing.refundableAmount > 0 && (
                <Row label={order.paymentMethod === "cod" ? "To refund (manual for COD)" : "Refundable"} strong>
                  {formatPrice(pricing.refundableAmount)}
                </Row>
              )}
              {pricing.refundedAmount > 0 && <Row label="Refunded to wallet">{formatPrice(pricing.refundedAmount)}</Row>}
            </dl>
            {order.deliveredAt && <p className="mt-3 text-[12.5px] text-slate-500">Delivered {formatDateTime(order.deliveredAt)}</p>}
          </section>
        </div>
      </div>

      <AdminCancelOrderModal open={isCancelOpen} order={order} onClose={() => setIsCancelOpen(false)} />
      <ReturnDecisionModal
        open={decision.open}
        orderId={order._id}
        item={decision.item}
        decision={decision.decision}
        onClose={() => setDecision((current) => ({ ...current, open: false }))}
      />
    </div>
  );
};

export default AdminOrderDetailPage;
