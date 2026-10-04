import { useEffect, useId, useLayoutEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LazyMotion, MotionConfig, domAnimation, m } from "framer-motion";
import toast from "react-hot-toast";
import { ArrowLeft, CalendarClock, Copy, ExternalLink, HelpCircle, Loader2, MapPin, PackageSearch, RotateCcw, Truck, XCircle } from "lucide-react";
import Header from "../../components/Layout/Header";
import Footer from "../../components/Layout/Footer";
import SectionError from "../../components/Home/SectionError";
import TrackingStepper from "../../components/Order/TrackingStepper";
import OrderTimeline from "../../components/Order/OrderTimeline";
import OrderItemRow from "../../components/Order/OrderItemRow";
import CancelOrderModal from "../../components/Order/CancelOrderModal";
import ReturnOrderModal from "../../components/Order/ReturnOrderModal";
import { OrderStatusPill, PaymentStatusPill } from "../../components/Order/OrderPills";
import { useGetMyOrder } from "../../hooks/Order/OrderHooks";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { CONTAINER, FOCUS_RING, PAGE_BACKGROUND } from "../../constants/customerTheme";
import { formatAddress } from "../../utils/address";
import { formatPrice } from "../../utils/product";
import { formatDate } from "../../utils/date";
import { PAYMENT_METHOD_LABELS, daysLeft, formatDateTime, isPast } from "../../utils/order";

const CARD = "rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_4px_18px_-12px_rgba(59,42,138,0.18)] sm:p-6";
const ORDER_ACTION = `inline-flex h-11 items-center justify-center gap-2 rounded-full border bg-white px-5 text-[14px] font-bold transition-colors ${FOCUS_RING}`;

const Row = ({ label, valueClassName = "text-[#1e1a3a]", children }) => (
  <div className="flex items-center justify-between gap-4 text-[14px]">
    <dt className="text-slate-500">{label}</dt>
    <dd className={`font-semibold ${valueClassName}`}>{children}</dd>
  </div>
);

// Courier, tracking number (copyable), tracking link and expected date, once shipped
const TrackingInfo = ({ tracking }) => {
  if (!tracking?.courier && !tracking?.expectedDelivery) return null;

  const copyNumber = () =>
    navigator.clipboard
      ?.writeText(tracking.trackingNumber)
      .then(() => toast.success("Tracking number copied", { id: "tracking-copied" }))
      .catch(() => toast.error("Couldn't copy. Select the number instead.", { id: "tracking-copied" }));

  return (
    <div className="mt-5 grid gap-3 rounded-2xl bg-[#fff5fa] p-4 sm:grid-cols-2">
      {tracking.courier && (
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">
            <Truck size={14} aria-hidden="true" />
            {tracking.courier}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <span className="break-all text-[14px] font-bold text-[#1e1a3a]">{tracking.trackingNumber}</span>
            <button
              type="button"
              onClick={copyNumber}
              aria-label="Copy tracking number"
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-[#d6008a] hover:bg-white ${FOCUS_RING}`}
            >
              <Copy size={15} aria-hidden="true" />
            </button>
          </div>
          {tracking.trackingUrl && (
            <a
              href={tracking.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-1 inline-flex min-h-10 items-center gap-1.5 rounded-full text-[13px] font-bold text-[#d6008a] hover:text-[#9d0063] ${FOCUS_RING}`}
            >
              Track shipment
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          )}
        </div>
      )}
      {tracking.expectedDelivery && (
        <div>
          <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">
            <CalendarClock size={14} aria-hidden="true" />
            Expected delivery
          </p>
          <p className="mt-1 text-[14px] font-bold text-[#1e1a3a]">{formatDate(tracking.expectedDelivery)}</p>
        </div>
      )}
    </div>
  );
};

const ReturnWindowNote = ({ order }) => {
  if (!order.returnWindowEndsAt) return null;
  const remaining = daysLeft(order.returnWindowEndsAt);
  const isOpen = !isPast(order.returnWindowEndsAt);
  return (
    <p className="mt-4 text-[12.5px] text-slate-500">
      {isOpen
        ? `Returns (size mismatch, unopened packs) are open until ${formatDate(order.returnWindowEndsAt)}${remaining ? ` · ${remaining} ${remaining === 1 ? "day" : "days"} left` : " · last day"}.`
        : `The return window closed on ${formatDate(order.returnWindowEndsAt)}.`}
    </p>
  );
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const headingId = useId();
  const { data, isLoading, isError, isFetching, refetch, error } = useGetMyOrder(id);
  const order = data?.data;
  // { type: "cancel" | "return", item: item | null }; kept while closing so the modal text doesn't jump
  const [dialog, setDialog] = useState({ open: false, type: "cancel", item: null });
  const openDialog = (type, item = null) => setDialog({ open: true, type, item });
  const closeDialog = () => setDialog((current) => ({ ...current, open: false }));

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = order ? `Order ${order.orderNumber} | Care N Safe` : "Order | Care N Safe";
    return () => {
      document.title = previousTitle;
    };
  }, [order]);

  let content;
  if (isLoading) {
    content = (
      <div className="flex justify-center py-24">
        <Loader2 size={32} aria-label="Loading order" className="animate-spin text-[#d6008a]" />
      </div>
    );
  } else if (isError && error?.response?.status === 404) {
    content = (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-pink-200 bg-white px-6 py-14 text-center">
        <PackageSearch size={38} strokeWidth={1.6} aria-hidden="true" className="mb-2 text-pink-300" />
        <p className="text-[17px] font-extrabold text-[#1e1a3a]">Order not found</p>
        <p className="text-[13.5px] text-slate-500">It may belong to another account.</p>
      </div>
    );
  } else if (isError || !order) {
    content = <SectionError message="We couldn't load this order." onRetry={refetch} isRetrying={isFetching} />;
  } else {
    const { pricing, shippingAddress: address } = order;
    content = (
      <div className="flex flex-col gap-5">
        <section aria-labelledby={headingId} className={CARD}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 id={headingId} className="break-all text-[22px] font-extrabold leading-tight text-[#1e1a3a] sm:text-[26px]">
                Order #{order.orderNumber}
              </h1>
              <p className="mt-1 text-[13px] text-slate-500">Placed on {formatDateTime(order.createdAt)}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <OrderStatusPill status={order.orderStatus} />
                <PaymentStatusPill order={order} />
              </div>
            </div>
            <Link
              to={FRONTEND_ROUTES.CONTACT}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold text-[#d6008a] hover:bg-[#fff5fa] hover:text-[#9d0063] ${FOCUS_RING}`}
            >
              <HelpCircle size={16} aria-hidden="true" />
              Need help?
            </Link>
          </div>

          <div className="mt-6">
            <TrackingStepper order={order} />
          </div>
          <TrackingInfo tracking={order.tracking} />
          <div className="mt-4 border-t border-slate-100 pt-3">
            <OrderTimeline history={order.statusHistory} />
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-start">
          <section aria-label="Items" className={CARD}>
            <h2 className="mb-4 text-[17px] font-extrabold text-[#1e1a3a]">Items</h2>
            <ul className="flex flex-col divide-y divide-slate-100">
              {order.items.map((item) => (
                <OrderItemRow
                  key={item._id}
                  item={item}
                  paymentMethod={order.paymentMethod}
                  onCancel={(target) => openDialog("cancel", target)}
                  onReturn={(target) => openDialog("return", target)}
                />
              ))}
            </ul>

            {(order.canCancel || order.canReturn) && (
              <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
                {order.canCancel && (
                  <button type="button" onClick={() => openDialog("cancel")} className={`${ORDER_ACTION} border-rose-200 text-rose-600 hover:bg-rose-50`}>
                    <XCircle size={16} aria-hidden="true" />
                    Cancel order
                  </button>
                )}
                {order.canReturn && (
                  <button type="button" onClick={() => openDialog("return")} className={`${ORDER_ACTION} border-amber-200 text-amber-700 hover:bg-amber-50`}>
                    <RotateCcw size={16} aria-hidden="true" />
                    Return order
                  </button>
                )}
              </div>
            )}
            <ReturnWindowNote order={order} />
          </section>

          <div className="flex flex-col gap-5 lg:sticky lg:top-28">
            <section aria-label="Delivery address" className={CARD}>
              <h2 className="flex items-center gap-2 text-[16px] font-extrabold text-[#1e1a3a]">
                <MapPin size={17} aria-hidden="true" className="text-[#d6008a]" />
                Delivery address
              </h2>
              <p className="mt-3 text-[14px] font-bold text-[#1e1a3a]">{address.fullName}</p>
              <p className="text-[13px] text-slate-500">{address.phone}</p>
              <p className="mt-1.5 break-words text-[13px] leading-relaxed text-slate-600">{formatAddress(address)}</p>
            </section>

            <section aria-label="Price details" className={CARD}>
              <h2 className="text-[16px] font-extrabold text-[#1e1a3a]">Price details</h2>
              <dl className="mt-3 flex flex-col gap-2.5">
                <Row label="Subtotal">{formatPrice(pricing.subtotal)}</Row>
                <Row label="Discount" valueClassName={pricing.discount > 0 ? "text-emerald-600" : "text-[#1e1a3a]"}>
                  {pricing.discount > 0 ? `− ${formatPrice(pricing.discount)}` : formatPrice(0)}
                </Row>
                <Row label="Shipping" valueClassName={pricing.shipping === 0 ? "text-emerald-600" : "text-[#1e1a3a]"}>
                  {pricing.shipping === 0 ? "FREE" : formatPrice(pricing.shipping)}
                </Row>
              </dl>
              <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-slate-100 pt-3">
                <span className="text-[15px] font-bold text-[#1e1a3a]">Total</span>
                <span className="text-[20px] font-extrabold text-[#1e1a3a]">{formatPrice(pricing.total)}</span>
              </div>
              {pricing.refundedAmount > 0 ? (
                <p className="mt-3 flex justify-between gap-4 rounded-xl bg-emerald-50 px-3 py-2 text-[13px] font-bold text-emerald-700">
                  <span>Refunded to wallet</span>
                  <span>{formatPrice(pricing.refundedAmount)}</span>
                </p>
              ) : (
                pricing.refundableAmount > 0 && (
                  <p className="mt-3 flex justify-between gap-4 rounded-xl bg-emerald-50 px-3 py-2 text-[13px] font-bold text-emerald-700">
                    <span>Refund for returns</span>
                    <span>{formatPrice(pricing.refundableAmount)}</span>
                  </p>
                )
              )}
              <p className="mt-3 text-[12.5px] text-slate-500">Payment: {PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans ${PAGE_BACKGROUND}`}>
      <Header />
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <main className="flex-1 overflow-x-clip">
            <div className={`${CONTAINER} pt-6 pb-12`}>
              <m.div
                className="mx-auto max-w-[1100px]"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <Link
                  to={FRONTEND_ROUTES.ORDERS}
                  className={`mb-3 -ml-2 inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-[13px] font-bold text-slate-600 hover:text-[#d6008a] ${FOCUS_RING}`}
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  My Orders
                </Link>
                {content}
              </m.div>
            </div>
          </main>
        </MotionConfig>
      </LazyMotion>
      <Footer />

      <CancelOrderModal open={dialog.open && dialog.type === "cancel"} order={order} item={dialog.item} onClose={closeDialog} />
      <ReturnOrderModal open={dialog.open && dialog.type === "return"} order={order} item={dialog.item} onClose={closeDialog} />
    </div>
  );
};

export default OrderDetailPage;
