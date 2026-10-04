import { useEffect, useId, useLayoutEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LazyMotion, MotionConfig, domAnimation, m } from "framer-motion";
import toast from "react-hot-toast";
import { ChevronDown, Loader2 } from "lucide-react";
import Header from "../../components/Layout/Header";
import Footer from "../../components/Layout/Footer";
import SectionError from "../../components/Home/SectionError";
import CheckoutSteps from "../../components/Checkout/CheckoutSteps";
import AddressStep from "../../components/Checkout/AddressStep";
import PaymentStep from "../../components/Checkout/PaymentStep";
import CheckoutSummary from "../../components/Checkout/CheckoutSummary";
import MobilePlaceOrderBar from "../../components/Checkout/MobilePlaceOrderBar";
import { useGetCart } from "../../hooks/Cart/CartHooks";
import { useGetAddresses } from "../../hooks/Address/AddressHooks";
import { usePlaceOrder } from "../../hooks/Order/OrderHooks";
import { FRONTEND_ROUTES, orderSuccessPath } from "../../constants/frontendRoutes";
import { CONTAINER, FOCUS_RING, PAGE_BACKGROUND } from "../../constants/customerTheme";
import { checkoutTotals } from "../../utils/checkout";
import { formatPrice } from "../../utils/product";
import { getErrorMessage } from "../../utils/errorMessage";

// Nothing to order (empty cart, or only unavailable lines): back to the cart with a toast (in an effect, not render)
const EmptyCartRedirect = () => {
  useEffect(() => {
    toast.error("Your cart is empty. Add something before checking out.", { id: "checkout-empty" });
  }, []);
  return <Navigate to={FRONTEND_ROUTES.CART} replace />;
};

const CheckoutPage = () => {
  const headingId = useId();
  const summaryId = useId();
  const navigate = useNavigate();
  const cartQuery = useGetCart();
  const addressesQuery = useGetAddresses();
  const placeOrderMutation = usePlaceOrder();
  const [chosenAddressId, setChosenAddressId] = useState(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  // Cash on Delivery is the only method until Razorpay; "Pay Online" is shown disabled
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const isPlacing = placeOrderMutation.isPending;

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Checkout | Care N Safe";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const items = (cartQuery.data?.data?.items || []).filter((item) => item.isAvailable);
  const totals = checkoutTotals(cartQuery.data?.data?.summary);
  const addresses = addressesQuery.data?.data || [];
  // The user's pick while it still exists, else the default (the list has the default first)
  const selectedAddress = addresses.find((address) => address._id === chosenAddressId) || addresses[0] || null;

  let blockedReason = "";
  if (!selectedAddress) blockedReason = "Add a delivery address to continue.";
  else if (!paymentMethod) blockedReason = "Choose a payment method.";
  const canPlaceOrder = !blockedReason;

  // The server recomputes prices and stock from the cart, takes the stock, creates the order and clears the cart
  const placeOrder = () => {
    if (!canPlaceOrder || isPlacing) return;
    placeOrderMutation.mutate(
      { addressId: selectedAddress._id, paymentMethod },
      {
        onSuccess: (response) => navigate(orderSuccessPath(response.data._id), { replace: true }),
        onError: (error) => {
          toast.error(getErrorMessage(error, "Couldn't place your order. Please try again."), { id: "place-order-error" });
          // Stock or prices may have changed: show the cart as it is now
          cartQuery.refetch();
        },
      }
    );
  };

  // While placing / after success the emptied cart must not bounce the user back to the cart page
  if (cartQuery.isSuccess && items.length === 0 && !isPlacing && !placeOrderMutation.isSuccess) return <EmptyCartRedirect />;

  let content;
  if (cartQuery.isLoading) {
    content = (
      <div className="flex justify-center py-24">
        <Loader2 size={32} aria-label="Loading checkout" className="animate-spin text-[#d6008a]" />
      </div>
    );
  } else if (cartQuery.isError) {
    content = <SectionError message="We couldn't load your cart." onRetry={cartQuery.refetch} isRetrying={cartQuery.isFetching} />;
  } else {
    content = (
      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-6">
        {/* Phones: summary first, collapsed behind a toggle. Desktop: sticky right column. */}
        <div className="lg:sticky lg:top-28 lg:order-2">
          <button
            type="button"
            onClick={() => setIsSummaryOpen((open) => !open)}
            aria-expanded={isSummaryOpen}
            aria-controls={summaryId}
            className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-pink-100 bg-white px-4 text-[14px] font-bold text-[#1e1a3a] lg:hidden ${FOCUS_RING}`}
          >
            <span>
              {isSummaryOpen ? "Hide" : "Show"} order summary · {formatPrice(totals.total)}
            </span>
            <ChevronDown size={18} aria-hidden="true" className={`text-[#d6008a] transition-transform ${isSummaryOpen ? "rotate-180" : ""}`} />
          </button>
          <div id={summaryId} className={`mt-3 lg:mt-0 lg:block ${isSummaryOpen ? "block" : "hidden"}`}>
            <CheckoutSummary
              items={items}
              totals={totals}
              canPlaceOrder={canPlaceOrder}
              isPlacing={isPlacing}
              onPlaceOrder={placeOrder}
              blockedReason={blockedReason}
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5 lg:order-1">
          <AddressStep addressesQuery={addressesQuery} selectedId={selectedAddress?._id} onSelect={setChosenAddressId} />
          <PaymentStep method={paymentMethod} onChange={setPaymentMethod} />
        </div>
      </div>
    );
  }

  const showBar = cartQuery.isSuccess && items.length > 0;

  return (
    <div className={`min-h-screen flex flex-col font-sans ${PAGE_BACKGROUND}`}>
      <Header />

      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <main className="flex-1 overflow-x-clip">
            <section aria-labelledby={headingId} className={`${CONTAINER} pt-8 pb-12`}>
              <m.div
                className="mx-auto max-w-[1240px]"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h1 id={headingId} className="text-[30px] font-extrabold leading-tight tracking-tight text-[#1e1a3a] sm:text-[40px]">
                    <span className="font-accent font-medium italic text-[#d6008a]">Checkout</span>
                  </h1>
                  <CheckoutSteps current={selectedAddress ? 2 : 1} />
                </div>
                <div className="mt-6">{content}</div>
              </m.div>
            </section>
          </main>

          {showBar && (
            <MobilePlaceOrderBar
              total={totals.total}
              blockedReason={blockedReason}
              canPlaceOrder={canPlaceOrder}
              isPlacing={isPlacing}
              onPlaceOrder={placeOrder}
            />
          )}
        </MotionConfig>
      </LazyMotion>

      <Footer />
      {/* Keeps the end of the footer reachable above the mobile bar */}
      {showBar && <div aria-hidden="true" className="h-24 bg-[#2c265a] lg:hidden" />}
    </div>
  );
};

export default CheckoutPage;
