import { useEffect, useId, useLayoutEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { LazyMotion, MotionConfig, domAnimation, m } from "framer-motion";
import { Check, Loader2, MapPin, Package, Wallet } from "lucide-react";
import Header from "../../components/Layout/Header";
import Footer from "../../components/Layout/Footer";
import SectionError from "../../components/Home/SectionError";
import { useGetMyOrder } from "../../hooks/Order/OrderHooks";
import { FRONTEND_ROUTES, orderDetailPath } from "../../constants/frontendRoutes";
import { BRAND_GRADIENT, CONTAINER, FOCUS_RING, PAGE_BACKGROUND } from "../../constants/customerTheme";
import { formatPrice } from "../../utils/product";
import { formatAddress } from "../../utils/address";
import { PAYMENT_METHOD_LABELS } from "../../utils/order";

const SummaryRow = ({ label, valueClassName = "text-[#1e1a3a]", children }) => (
  <div className="flex justify-between gap-4">
    <dt className="text-slate-500">{label}</dt>
    <dd className={`font-semibold ${valueClassName}`}>{children}</dd>
  </div>
);

// Confirmation for a placed order (loaded from the API, so refreshing the page keeps working)
const OrderSuccessPage = () => {
  const { id } = useParams();
  const headingId = useId();
  const { data, isLoading, isError, isFetching, refetch } = useGetMyOrder(id);
  const order = data?.data;

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Order placed | Care N Safe";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  let content;
  if (isLoading) {
    content = (
      <div className="flex justify-center py-24">
        <Loader2 size={32} aria-label="Loading your order" className="animate-spin text-[#d6008a]" />
      </div>
    );
  } else if (isError || !order) {
    content = <SectionError message="We couldn't load your order." onRetry={refetch} isRetrying={isFetching} />;
  } else {
    const { pricing } = order;
    content = (
      <m.section
        aria-labelledby={headingId}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="mx-auto flex max-w-[640px] flex-col items-center text-center"
      >
        <m.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60"
        >
          <m.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.3 }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white"
          >
            <Check size={30} strokeWidth={3} aria-hidden="true" />
          </m.span>
        </m.span>

        <h1 id={headingId} className="mt-6 text-[28px] font-extrabold leading-tight tracking-tight text-[#1e1a3a] sm:text-[34px]">
          Order <span className="font-accent font-medium italic text-[#d6008a]">placed</span>
        </h1>
        <p className="mt-2 text-[14px] text-slate-500">Thank you! We&apos;ll let you know when it ships.</p>
        <p className="mt-3 break-all rounded-full bg-[#fff5fa] px-4 py-1.5 text-[13px] font-bold text-[#d6008a]">{order.orderNumber}</p>

        <div className="mt-8 w-full rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-[0_4px_18px_-12px_rgba(59,42,138,0.18)] sm:p-6">
          <h2 className="flex items-center gap-2 text-[16px] font-extrabold text-[#1e1a3a]">
            <Package size={18} aria-hidden="true" className="text-[#d6008a]" />
            Order summary
          </h2>
          <ul className="mt-3 flex flex-col gap-2.5">
            {order.items.map((item) => (
              <li key={item._id} className="flex justify-between gap-4 text-[13.5px]">
                <span className="min-w-0 text-slate-600">
                  {item.name} <span className="text-slate-400">× {item.quantity}</span>
                </span>
                <span className="flex-shrink-0 font-semibold text-[#1e1a3a]">{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 text-[13.5px]">
            <SummaryRow label="Subtotal">{formatPrice(pricing.subtotal)}</SummaryRow>
            <SummaryRow label="Discount">{formatPrice(pricing.discount)}</SummaryRow>
            <SummaryRow label="Shipping" valueClassName={pricing.shipping === 0 ? "text-emerald-600" : "text-[#1e1a3a]"}>
              {pricing.shipping === 0 ? "FREE" : formatPrice(pricing.shipping)}
            </SummaryRow>
            <div className="flex justify-between gap-4 border-t border-slate-100 pt-3 text-[15px]">
              <dt className="font-bold text-[#1e1a3a]">Total</dt>
              <dd className="font-extrabold text-[#1e1a3a]">{formatPrice(pricing.total)}</dd>
            </div>
          </dl>
          <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-[13px] sm:grid-cols-2">
            <p className="flex items-start gap-2 text-slate-600">
              <MapPin size={15} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-[#d6008a]" />
              <span className="min-w-0 break-words">
                <span className="block font-bold text-[#1e1a3a]">{order.shippingAddress.fullName}</span>
                {formatAddress(order.shippingAddress)}
              </span>
            </p>
            <p className="flex items-start gap-2 text-slate-600">
              <Wallet size={15} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-[#d6008a]" />
              <span>
                <span className="block font-bold text-[#1e1a3a]">Payment</span>
                {PAYMENT_METHOD_LABELS[order.paymentMethod]} · {formatPrice(pricing.total)} on delivery
              </span>
            </p>
          </div>
        </div>

        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            to={FRONTEND_ROUTES.SHOP}
            className={`inline-flex h-12 items-center justify-center rounded-full px-7 text-[15px] font-bold text-white ${BRAND_GRADIENT} shadow-[0_6px_18px_rgba(124,58,237,0.28)] hover:brightness-110 transition-all ${FOCUS_RING}`}
          >
            Continue Shopping
          </Link>
          <Link
            to={orderDetailPath(order._id)}
            className={`inline-flex h-12 items-center justify-center rounded-full border border-[#d6008a] bg-white px-7 text-[15px] font-bold text-[#d6008a] hover:bg-[#fff5fa] hover:text-[#9d0063] transition-colors ${FOCUS_RING}`}
          >
            View Order
          </Link>
        </div>
      </m.section>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans ${PAGE_BACKGROUND}`}>
      <Header />
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <main className={`flex-1 ${CONTAINER} py-10 sm:py-14`}>{content}</main>
        </MotionConfig>
      </LazyMotion>
      <Footer />
    </div>
  );
};

export default OrderSuccessPage;
