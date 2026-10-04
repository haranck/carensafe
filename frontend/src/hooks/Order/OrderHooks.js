import { useSelector } from "react-redux";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelOrder, getMyOrder, getMyOrders, placeOrder, requestReturn } from "../../services/Order/orderService";

// Keys carry the user id (like cart / wishlist), so another account on this browser never sees cached orders
const useSession = () => {
    const isLoggedIn = useSelector((s) => Boolean(s.token.accessToken));
    const userId = useSelector((s) => s.auth.user?.id);
    return { isLoggedIn, userId };
};

// A changed order refreshes its detail and every list (and the admin views, if open in this browser)
const ORDER_PREFIXES = [["orders"], ["order"], ["admin_orders"], ["admin_order"], ["admin_order_stats"], ["admin_return_items"]];
const CART_PREFIXES = [["cart"], ["cart_count"], ["cart_recommendations"]];

const useInvalidate = (prefixes) => {
    const queryClient = useQueryClient();
    return () => Promise.all(prefixes.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
};

// { page, limit, status }
export const useGetMyOrders = ({ page = 1, limit = 10, status = "" } = {}) => {
    const { isLoggedIn, userId } = useSession();
    return useQuery({
        queryKey: ["orders", userId, page, limit, status],
        queryFn: () => getMyOrders({ page, limit, status }),
        enabled: isLoggedIn,
        placeholderData: keepPreviousData,
    });
};

export const useGetMyOrder = (id) => {
    const { isLoggedIn, userId } = useSession();
    return useQuery({ queryKey: ["order", userId, id], queryFn: () => getMyOrder(id), enabled: isLoggedIn && Boolean(id) });
};

// { addressId, paymentMethod }: the server clears the cart, so the cart queries refresh too. Not awaited, so the
// checkout navigates to the success page before the emptied cart arrives.
export const usePlaceOrder = () => {
    const invalidate = useInvalidate([...ORDER_PREFIXES, ...CART_PREFIXES]);
    return useMutation({
        mutationFn: placeOrder,
        onSuccess: () => {
            invalidate();
        },
    });
};

// The answer is the updated order: shown at once, then everything refetches
const useOrderMutation = (mutationFn) => {
    const queryClient = useQueryClient();
    const { userId } = useSession();
    const invalidate = useInvalidate(ORDER_PREFIXES);
    return useMutation({
        mutationFn,
        onSuccess: (response) => {
            queryClient.setQueryData(["order", userId, response.data._id], response);
            return invalidate();
        },
    });
};

// { orderId, itemId?, reason, note }
export const useCancelOrder = () => useOrderMutation(cancelOrder);

// { orderId, itemId?, note, packUnopenedConfirmed }
export const useRequestReturn = () => useOrderMutation(requestReturn);
