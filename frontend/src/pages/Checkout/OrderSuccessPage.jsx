import { useEffect, useId, useLayoutEffect } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { LazyMotion, MotionConfig, domAnimation, m } from "framer-motion";
import { Check, MapPin, Package, Wallet } from "lucide-react";
import Header from "../../components/Layout/Header";
import Footer from "../../components/Layout/Footer";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { BRAND_GRADIENT, CONTAINER, FOCUS_RING, PAGE_BACKGROUND } from "../../constants/customerTheme";
import { formatPrice } from "../../utils/product";

// Demo confirmation. The order only exists in router state (nothing is saved); opening this page directly → shop.
const OrderSuccessPage = () => {
  const headingId = useId();
  const order = useLocation().state?.order;

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

  if (!order) return <Navigate to={FRONTEND_ROUTES.SHOP} replace />;

  const { totals } = order;

  return (
    <div className={`min-h-screen flex flex-col font-sans ${PAGE_BACKGROUND}`}>
      <Header />

      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <main className={`flex-1 ${CONTAINER} py-10 sm:py-14`}>
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
                Order placed <span className="font-accent font-medium italic text-[#d6008a]">(demo)</span>
              </h1>
              <p className="mt-2 text-[14px] text-slate-500">
                This was a demo checkout: no payment was taken and no order was created. Your cart is unchanged.
              </p>
              <p className="mt-3 rounded-full bg-[#fff5fa] px-4 py-1.5 text-[13px] font-bold text-[#d6008a]">{order.orderNumber}</p>

              <div className="mt-8 w-full rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-[0_4px_18px_-12px_rgba(59,42,138,0.18)] sm:p-6">
                <h2 className="flex items-center gap-2 text-[16px] font-extrabold text-[#1e1a3a]">
                  <Package size={18} aria-hidden="true" className="text-[#d6008a]" />
                  Order summary
                </h2>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {order.items.map((item) => (
                    <li key={item.itemId} className="flex justify-between gap-4 text-[13.5px]">
                      <span className="min-w-0 text-slate-600">
                        {item.name} <span className="text-slate-400">× {item.quantity}</span>
                      </span>
                      <span className="flex-shrink-0 font-semibold text-[#1e1a3a]">{formatPrice(item.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 text-[13.5px]">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Subtotal</dt>
                    <dd className="font-semibold text-[#1e1a3a]">{formatPrice(totals.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Discount</dt>
                    <dd className="font-semibold text-[#1e1a3a]">{formatPrice(totals.discount)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Shipping</dt>
                    <dd className="font-semibold text-emerald-600">{totals.shipping === 0 ? "FREE" : formatPrice(totals.shipping)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-slate-100 pt-3 text-[15px]">
                    <dt className="font-bold text-[#1e1a3a]">Total</dt>
                    <dd className="font-extrabold text-[#1e1a3a]">{formatPrice(totals.total)}</dd>
                  </div>
                </dl>
                <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-[13px] sm:grid-cols-2">
                  <p className="flex items-start gap-2 text-slate-600">
                    <MapPin size={15} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-[#d6008a]" />
                    <span className="min-w-0 break-words">
                      <span className="block font-bold text-[#1e1a3a]">{order.address.fullName}</span>
                      {order.address.text}
                    </span>
                  </p>
                  <p className="flex items-start gap-2 text-slate-600">
                    <Wallet size={15} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-[#d6008a]" />
                    <span>
                      <span className="block font-bold text-[#1e1a3a]">Payment</span>
                      {order.paymentMethod}
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
                  to={FRONTEND_ROUTES.ORDERS}
                  className={`inline-flex h-12 items-center justify-center rounded-full border border-[#d6008a] bg-white px-7 text-[15px] font-bold text-[#d6008a] hover:bg-[#fff5fa] hover:text-[#9d0063] transition-colors ${FOCUS_RING}`}
                >
                  View Orders
                </Link>
              </div>
            </m.section>
          </main>
        </MotionConfig>
      </LazyMotion>

      <Footer />
    </div>
  );
};

export default OrderSuccessPage;
