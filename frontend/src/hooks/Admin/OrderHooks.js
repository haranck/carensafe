import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    cancelAdminOrder,
    decideReturn,
    getAdminOrder,
    getAdminOrderStats,
    getAdminOrders,
    getAdminReturnItems,
    markReturnReceived,
    updateAdminOrderStatus,
} from "../../services/Admin/orderService";

// Any admin change refreshes the lists, stats, return requests and the customer's own order views
const ORDER_PREFIXES = [["admin_orders"], ["admin_order"], ["admin_order_stats"], ["admin_return_items"], ["orders"], ["order"]];

// filters: { page, limit, search, orderStatus, paymentStatus, from, to, hasReturnRequest }
export const useGetAdminOrders = (filters) =>
    useQuery({
        queryKey: ["admin_orders", filters],
        queryFn: () => getAdminOrders(filters),
        placeholderData: keepPreviousData,
    });

export const useGetAdminOrderStats = () =>
    useQuery({ queryKey: ["admin_order_stats"], queryFn: getAdminOrderStats, staleTime: 30 * 1000 });

export const useGetAdminReturnItems = (page, limit) =>
    useQuery({
        queryKey: ["admin_return_items", page, limit],
        queryFn: () => getAdminReturnItems({ page, limit }),
        placeholderData: keepPreviousData,
    });

export const useGetAdminOrder = (id) =>
    useQuery({ queryKey: ["admin_order", id], queryFn: () => getAdminOrder(id), enabled: Boolean(id) });

// Every mutation answers with the updated order: shown at once, then the rest refetches
const useAdminOrderMutation = (mutationFn) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn,
        onSuccess: (response) => {
            queryClient.setQueryData(["admin_order", response.data._id], response);
            return Promise.all(ORDER_PREFIXES.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
        },
    });
};

// { id, status, note, courier?, trackingNumber?, trackingUrl?, expectedDelivery? }
export const useUpdateAdminOrderStatus = () => useAdminOrderMutation(updateAdminOrderStatus);

// { id, reason, note }
export const useCancelAdminOrder = () => useAdminOrderMutation(cancelAdminOrder);

// { id, itemId, decision, adminReason? }
export const useDecideReturn = () => useAdminOrderMutation(decideReturn);

// { id, itemId }
export const useMarkReturnReceived = () => useAdminOrderMutation(markReturnReceived);
