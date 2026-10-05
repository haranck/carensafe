import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Clock, Loader2, ShoppingBag, XCircle } from "lucide-react";
import VerifyingOverlay from "../Payment/VerifyingOverlay";
import { useRetryPayment } from "../../hooks/Payment/PaymentHooks";
import { usePaymentFlow } from "../../hooks/Payment/usePaymentFlow";
import { formatCountdown, useCountdown } from "../../hooks/Payment/useCountdown";
import { useAddToCart } from "../../hooks/Cart/CartHooks";
import { FRONTEND_ROUTES, orderSuccessPath } from "../../constants/frontendRoutes";
import { BRAND_GRADIENT, FOCUS_RING } from "../../constants/customerTheme";
import { getErrorMessage } from "../../utils/errorMessage";
import { formatPaise } from "../../utils/wallet";

/**
 * Unpaid online order: amber banner with the time left to pay and "Complete payment" (the same Razorpay order,
 * re-checked by the server first). `compact` for order cards.
 */
export const PendingPaymentBanner = ({ order, compact = false }) => {
  const navigate = useNavigate();
  const remaining = useCountdown(order.expiresAt);
  const { mutate: retry, isPending: isStarting } = useRetryPayment();
  const { pay, isBusy, isVerifying } = usePaymentFlow();
  const isExpired = remaining === 0;
  const busy = isStarting || isBusy;
  const amount = order.payment?.onlinePaise || 0;

  const completePayment = () =>
    retry(order._id, {
      onSuccess: (response) => {
        const result = response.data;
        if (!result.paymentRequired) {
          toast.success("This order is already paid.", { id: "order-paid" });
          return;
        }
        pay({
          checkout: result.razorpay,
          orderId: order._id,
          onSuccess: () => navigate(orderSuccessPath(order._id)),
          onUnconfirmed: () => toast("We're confirming your payment — this page will update shortly.", { id: "payment-confirming" }),
        });
      },
      onError: (error) => toast.error(getErrorMessage(error, "Couldn't start the payment. Please try again."), { id: "retry-payment" }),
    });

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 sm:flex-row sm:items-center sm:justify-between ${compact ? "px-3.5 py-3" : "px-4 py-4 sm:px-5"}`}
    >
      <p className="flex items-start gap-2 text-[13px] font-semibold">
        <Clock size={16} aria-hidden="true" className="mt-0.5 flex-shrink-0" />
        <span>
          {isExpired ? (
            "The payment window has closed. Your items are being released."
          ) : (
            <>
              Payment pending{amount > 0 && ` · ${formatPaise(amount)}`} — complete it within{" "}
              <span className="font-mono font-bold" aria-live="off">
                {remaining === null ? "a few minutes" : formatCountdown(remaining)}
              </span>{" "}
              to keep your items reserved.
            </>
          )}
        </span>
      </p>
      {!isExpired && (
        <button
          type="button"
          onClick={completePayment}
          disabled={busy}
          className={`inline-flex h-10 flex-shrink-0 items-center justify-center gap-2 rounded-full px-5 text-[13.5px] font-bold text-white ${BRAND_GRADIENT} disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`}
        >
          {busy && <Loader2 size={15} aria-hidden="true" className="animate-spin" />}
          Complete payment
        </button>
      )}
      <VerifyingOverlay show={isVerifying} />
    </div>
  );
};

/** Order closed before payment: rose banner with "Order again" (the same items back in the cart). */
export const UnpaidClosedBanner = ({ order }) => {
  const navigate = useNavigate();
  const { mutateAsync: addToCart } = useAddToCart();
  const [isAdding, setIsAdding] = useState(false);

  const orderAgain = async () => {
    setIsAdding(true);
    let added = 0;
    for (const item of order.items) {
      try {
        await addToCart({ productId: item.product, variantId: item.variant, quantity: item.quantity });
        added++;
      } catch {
        // Out of stock / unavailable: the cart hook already showed why
      }
    }
    setIsAdding(false);
    if (added > 0) navigate(FRONTEND_ROUTES.CART);
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="flex items-start gap-2 text-[13px] font-semibold">
        <XCircle size={16} aria-hidden="true" className="mt-0.5 flex-shrink-0" />
        Payment not completed, order cancelled. {order.payment?.walletPaise > 0 && "The wallet amount was returned to your wallet."}
      </p>
      <button
        type="button"
        onClick={orderAgain}
        disabled={isAdding}
        className={`inline-flex h-10 flex-shrink-0 items-center justify-center gap-2 rounded-full border border-rose-300 bg-white px-5 text-[13.5px] font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60 ${FOCUS_RING}`}
      >
        {isAdding ? <Loader2 size={15} aria-hidden="true" className="animate-spin" /> : <ShoppingBag size={15} aria-hidden="true" />}
        Order again
      </button>
    </div>
  );
};
