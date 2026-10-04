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
import VerifyingOverlay from "../../components/Payment/VerifyingOverlay";
import { useGetCart } from "../../hooks/Cart/CartHooks";
import { useGetAddresses } from "../../hooks/Address/AddressHooks";
import { usePlaceOrder } from "../../hooks/Order/OrderHooks";
import { useWallet } from "../../hooks/Wallet/WalletHooks";
import { usePaymentFlow } from "../../hooks/Payment/usePaymentFlow";
import { FRONTEND_ROUTES, orderDetailPath, orderSuccessPath } from "../../constants/frontendRoutes";
import { CONTAINER, FOCUS_RING, PAGE_BACKGROUND } from "../../constants/customerTheme";
import { checkoutTotals, newCheckoutKey, paymentSplit } from "../../utils/checkout";
import { formatPaise } from "../../utils/wallet";
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
  const { data: walletData } = useWallet();
  const placeOrderMutation = usePlaceOrder();
  const { pay, isBusy: isPaying, isVerifying } = usePaymentFlow();
  const [chosenAddressId, setChosenAddressId] = useState(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [useWalletBalance, setUseWalletBalance] = useState(false);
  const isPlacing = placeOrderMutation.isPending;
  const isBusy = isPlacing || isPaying;

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
  const balancePaise = walletData?.data?.balance || 0;
  const testMode = walletData?.data?.paymentMode === "test";
  const totalPaise = Math.round(totals.total * 100);
  const wantsWallet = paymentMethod === "razorpay" && useWalletBalance;
  const split = paymentSplit({ totalRupees: totals.total, method: paymentMethod, useWallet: wantsWallet, balancePaise });

  // One idempotency key per checkout attempt: kept through retries / double clicks, new when the cart, address or
  // payment choice changes (state adjusted during render) or after a failed attempt
  const signature = `${items.map((item) => `${item.variantId}x${item.quantity}`).join(",")}|${selectedAddress?._id}|${paymentMethod}|${wantsWallet}`;
  const [attempt, setAttempt] = useState({ key: "", signature: "" });
  if (attempt.signature !== signature && !isBusy) setAttempt({ key: newCheckoutKey(), signature });

  let blockedReason = "";
  if (!selectedAddress) blockedReason = "Add a delivery address to continue.";
  else if (!paymentMethod) blockedReason = "Choose a payment method.";
  else if (paymentMethod === "wallet" && balancePaise < totalPaise) blockedReason = "Not enough wallet balance. Choose another method.";
  const canPlaceOrder = !blockedReason;

  let buttonLabel = "Place Order";
  if (split.method === "wallet") buttonLabel = `Pay ${formatPaise(split.walletPaise)} from wallet`;
  else if (split.method === "razorpay") buttonLabel = `Pay ${formatPaise(split.onlinePaise)}`;
  let busyLabel = "Placing order…";
  if (isVerifying) busyLabel = "Confirming payment…";
  else if (isPaying) busyLabel = "Waiting for payment…";

  /**
   * The server recomputes prices and stock, reserves the stock and creates the order (COD / wallet: final; online:
   * waiting for payment). Online → the Razorpay popup; closing it leaves the order payable from its page.
   */
  const placeOrder = () => {
    if (!canPlaceOrder || isBusy) return;
    placeOrderMutation.mutate(
      { addressId: selectedAddress._id, paymentMethod, useWallet: wantsWallet, idempotencyKey: attempt.key },
      {
        onSuccess: (response) => {
          const result = response.data;
          if (!result.paymentRequired) {
            navigate(orderSuccessPath(result.orderId), { replace: true });
            return;
          }
          pay({
            checkout: result.razorpay,
            orderId: result.orderId,
            onSuccess: () => navigate(orderSuccessPath(result.orderId), { replace: true }),
            onDismiss: () => navigate(orderDetailPath(result.orderId), { replace: true }),
            onUnconfirmed: () => {
              toast("We're confirming your payment — you'll see it in My Orders.", { id: "payment-confirming" });
              navigate(orderDetailPath(result.orderId), { replace: true });
            },
          });
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, "Couldn't place your order. Please try again."), { id: "place-order-error" });
          setAttempt({ key: newCheckoutKey(), signature });
          // Stock or prices may have changed: show the cart as it is now
          cartQuery.refetch();
        },
      }
    );
  };

  // While placing / paying / after success the cart must not bounce the user back to the cart page
  if (cartQuery.isSuccess && items.length === 0 && !isBusy && !placeOrderMutation.isSuccess) return <EmptyCartRedirect />;

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
              split={split}
              canPlaceOrder={canPlaceOrder}
              isPlacing={isBusy}
              onPlaceOrder={placeOrder}
              blockedReason={blockedReason}
              buttonLabel={buttonLabel}
              busyLabel={busyLabel}
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5 lg:order-1">
          <AddressStep addressesQuery={addressesQuery} selectedId={selectedAddress?._id} onSelect={setChosenAddressId} />
          <PaymentStep
            method={paymentMethod}
            onChange={setPaymentMethod}
            useWallet={useWalletBalance}
            onUseWalletChange={setUseWalletBalance}
            balancePaise={balancePaise}
            totalPaise={totalPaise}
            testMode={testMode}
          />
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
              {...(split.walletPaise > 0 && split.onlinePaise > 0 && { amountLabel: "Pay online", amount: formatPaise(split.onlinePaise) })}
              blockedReason={blockedReason}
              canPlaceOrder={canPlaceOrder}
              isPlacing={isBusy}
              onPlaceOrder={placeOrder}
              buttonLabel={buttonLabel}
              busyLabel={busyLabel}
            />
          )}
        </MotionConfig>
      </LazyMotion>

      <VerifyingOverlay show={isVerifying} />

      <Footer />
      {/* Keeps the end of the footer reachable above the mobile bar */}
      {showBar && <div aria-hidden="true" className="h-24 bg-[#2c265a] lg:hidden" />}
    </div>
  );
};

export default CheckoutPage;
