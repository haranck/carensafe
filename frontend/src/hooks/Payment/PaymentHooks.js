import { useSelector } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reportPaymentFailure, verifyPayment } from "../../services/Payment/paymentService";
import { retryOrderPayment } from "../../services/Order/orderService";
import { startWalletTopup } from "../../services/Wallet/walletService";

// A verified payment can change orders, the cart (bought items leave it) and the wallet
const PAYMENT_PREFIXES = [["orders"], ["order"], ["cart"], ["cart_count"], ["cart_recommendations"], ["wallet"], ["wallet_transactions"]];

const useInvalidatePayments = () => {
    const queryClient = useQueryClient();
    return () => Promise.all(PAYMENT_PREFIXES.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
};

// Razorpay handler response → { purpose, orderId, orderStatus, ... }
export const useVerifyPayment = () => {
    const invalidate = useInvalidatePayments();
    return useMutation({ mutationFn: verifyPayment, onSettled: invalidate });
};

export const useReportPaymentFailure = () => useMutation({ mutationFn: reportPaymentFailure });

// orderId → checkout details for the same Razorpay order
export const useRetryPayment = () => {
    const invalidate = useInvalidatePayments();
    return useMutation({ mutationFn: retryOrderPayment, onError: invalidate });
};

// rupees → checkout details for a wallet top-up
export const useStartTopup = () => useMutation({ mutationFn: startWalletTopup });

export const useSessionUserId = () => useSelector((s) => s.auth.user?.id);
