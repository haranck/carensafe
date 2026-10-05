import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { loadRazorpay } from "../../utils/loadRazorpay";
import { getMyOrder } from "../../services/Order/orderService";
import { useReportPaymentFailure, useSessionUserId, useVerifyPayment } from "./PaymentHooks";

const POLL_EVERY_MS = 3000;
const POLL_FOR_MS = 30000;
const THEME_COLOR = "#d6008a";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Razorpay Checkout, shared by checkout, "Complete payment" and wallet top-ups.
 * pay({ checkout, orderId?, onSuccess, onDismiss, onUnconfirmed }):
 * - opens the popup (script loaded once); payment.failed attempts are reported, the popup lets the user retry
 * - success → server verification → onSuccess(result)
 * - verification failed / unclear → for orders the order is polled every 3s for 30s (the webhook or reconcile may
 *   confirm it); still unknown → onUnconfirmed(). Money may have been taken, so it never says "failed".
 * - popup closed → toast + onDismiss()
 * phase: idle | opening | open | verifying (busy = anything but idle; warn before leaving while verifying).
 */
export const usePaymentFlow = () => {
  const queryClient = useQueryClient();
  const userId = useSessionUserId();
  const { mutateAsync: verify } = useVerifyPayment();
  const { mutate: reportFailure } = useReportPaymentFailure();
  const [phase, setPhase] = useState("idle");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Leaving while a payment is being confirmed would hide the result from the user
  useEffect(() => {
    if (phase !== "verifying") return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase]);

  const setSafePhase = (next) => {
    if (mountedRef.current) setPhase(next);
  };

  const waitForPaidOrder = useCallback(
    async (orderId) => {
      const until = Date.now() + POLL_FOR_MS;
      while (Date.now() < until) {
        await wait(POLL_EVERY_MS);
        try {
          const response = await queryClient.fetchQuery({
            queryKey: ["order", userId, orderId],
            queryFn: () => getMyOrder(orderId),
            staleTime: 0,
          });
          if (response.data.paymentStatus === "paid") return response.data;
        } catch {
          // keep polling
        }
      }
      return null;
    },
    [queryClient, userId]
  );

  const pay = useCallback(
    async ({ checkout, orderId, onSuccess, onDismiss, onUnconfirmed }) => {
      setSafePhase("opening");
      let Razorpay;
      try {
        Razorpay = await loadRazorpay();
      } catch {
        setSafePhase("idle");
        toast.error("Couldn't load the payment window. Check your connection or disable blockers, then try again.", { id: "razorpay-load" });
        onDismiss?.();
        return;
      }

      const handleSuccess = async (response) => {
        setSafePhase("verifying");
        try {
          const result = await verify(response);
          setSafePhase("idle");
          onSuccess?.(result.data);
        } catch {
          const paid = orderId ? await waitForPaidOrder(orderId) : null;
          setSafePhase("idle");
          if (paid) onSuccess?.({ purpose: "order", orderId, orderStatus: paid.orderStatus });
          else onUnconfirmed?.();
        }
      };

      const rzp = new Razorpay({
        key: checkout.keyId,
        amount: checkout.amount,
        currency: checkout.currency,
        order_id: checkout.orderId,
        name: checkout.name,
        description: checkout.description,
        image: "/logo.webp",
        prefill: checkout.prefill,
        theme: { color: THEME_COLOR },
        retry: { enabled: true },
        handler: handleSuccess,
        modal: {
          escape: false,
          ondismiss: () => {
            setSafePhase("idle");
            toast("Payment not completed. You can retry from your orders.", { id: "payment-dismissed" });
            onDismiss?.();
          },
        },
      });
      rzp.on("payment.failed", (response) => {
        reportFailure({ razorpay_order_id: checkout.orderId, error: response?.error || {} });
        toast.error(response?.error?.description || "Payment failed. Please try again.", { id: "payment-failed" });
      });
      setSafePhase("open");
      rzp.open();
    },
    [verify, reportFailure, waitForPaidOrder]
  );

  return { pay, phase, isBusy: phase !== "idle", isVerifying: phase === "verifying" };
};
