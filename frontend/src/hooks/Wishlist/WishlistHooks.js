import { useSelector } from "react-redux";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
    addToWishlist,
    getWishlist,
    getWishlistIds,
    removeFromWishlist,
} from "../../services/Wishlist/wishlistService";
import { useRequireAuth } from "../Auth/useRequireAuth";
import { getErrorMessage } from "../../utils/errorMessage";

const IDS_STALE_TIME = 5 * 60 * 1000;

// Keys carry the user id, so another account on the same browser never sees the previous user's cached wishlist.
// Mutations invalidate by prefix: ["wishlist"] (list pages) and ["wishlist_ids"].
const wishlistKey = (userId) => ["wishlist", userId];
const wishlistIdsKey = (userId) => ["wishlist_ids", userId];

const useWishlistSession = () => {
    const isLoggedIn = useSelector((s) => Boolean(s.token.accessToken));
    const userId = useSelector((s) => s.auth.user?.id);
    return { isLoggedIn, userId };
};

const errorMessage = (error) => getErrorMessage(error, "Couldn't update your wishlist. Please try again.");

// Module-level so React Query keeps the same Set between renders until the data changes
const toIdSet = (response) => new Set(response.data);

const withId = (ids, productId) => (ids && !ids.data.includes(productId) ? { ...ids, data: [...ids.data, productId] } : ids);
const withoutId = (ids, productId) => ids && { ...ids, data: ids.data.filter((id) => id !== productId) };

// One cached list page without the item; the refetch afterwards fills the page back up
const withoutItem = (page, productId) =>
    page && {
        ...page,
        data: page.data.filter((item) => item._id !== productId),
        pagination: { ...page.pagination, total: Math.max(0, page.pagination.total - 1) },
    };

const useInvalidateWishlist = () => {
    const queryClient = useQueryClient();
    return () =>
        Promise.all([
            queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
            queryClient.invalidateQueries({ queryKey: ["wishlist_ids"] }),
        ]);
};

// Paginated wishlist (product cards + isAvailable + wishlistedAt)
export const useGetWishlist = (page, limit) => {
    const { isLoggedIn, userId } = useWishlistSession();
    return useQuery({
        queryKey: [...wishlistKey(userId), page, limit],
        queryFn: () => getWishlist(page, limit),
        enabled: isLoggedIn,
        placeholderData: keepPreviousData,
    });
};

// Set of wishlisted product ids, for heart states and the header count. Logged out → no request, no data.
export const useWishlistIds = () => {
    const { isLoggedIn, userId } = useWishlistSession();
    return useQuery({
        queryKey: wishlistIdsKey(userId),
        queryFn: getWishlistIds,
        enabled: isLoggedIn,
        staleTime: IDS_STALE_TIME,
        select: toIdSet,
    });
};

// item: { productId, variantId? }. The heart turns red straight away and rolls back if the server says no.
export const useAddToWishlist = () => {
    const queryClient = useQueryClient();
    const { userId } = useWishlistSession();
    const invalidateWishlist = useInvalidateWishlist();

    return useMutation({
        mutationFn: addToWishlist,
        onMutate: async ({ productId }) => {
            await queryClient.cancelQueries({ queryKey: wishlistIdsKey(userId) });
            queryClient.setQueryData(wishlistIdsKey(userId), (ids) => withId(ids, productId));
        },
        onError: (error, { productId }) => {
            queryClient.setQueryData(wishlistIdsKey(userId), (ids) => withoutId(ids, productId));
            toast.error(errorMessage(error), { id: `wishlist-error-${productId}` });
        },
        onSettled: invalidateWishlist,
    });
};

// Removes the id and the item from every cached list page straight away; restores them if the server says no
export const useRemoveFromWishlist = () => {
    const queryClient = useQueryClient();
    const { userId } = useWishlistSession();
    const invalidateWishlist = useInvalidateWishlist();

    return useMutation({
        mutationFn: removeFromWishlist,
        onMutate: async (productId) => {
            await Promise.all([
                queryClient.cancelQueries({ queryKey: wishlistIdsKey(userId) }),
                queryClient.cancelQueries({ queryKey: wishlistKey(userId) }),
            ]);
            const previousPages = queryClient.getQueriesData({ queryKey: wishlistKey(userId) });
            queryClient.setQueryData(wishlistIdsKey(userId), (ids) => withoutId(ids, productId));
            queryClient.setQueriesData({ queryKey: wishlistKey(userId) }, (page) => withoutItem(page, productId));
            return { previousPages };
        },
        onError: (error, productId, context) => {
            queryClient.setQueryData(wishlistIdsKey(userId), (ids) => withId(ids, productId));
            context?.previousPages.forEach(([queryKey, page]) => queryClient.setQueryData(queryKey, page));
            toast.error(errorMessage(error), { id: `wishlist-error-${productId}` });
        },
        onSettled: invalidateWishlist,
    });
};

/**
 * Shared heart logic for product cards and the detail page.
 * Guests go through the login gate (toast + login, then back to this page after logging in).
 */
export const useWishlistToggle = (productId, variantId) => {
    const requireAuth = useRequireAuth();
    const { data: wishlistIds } = useWishlistIds();
    const { mutate: add, isPending: isAdding } = useAddToWishlist();
    const { mutate: remove, isPending: isRemoving } = useRemoveFromWishlist();

    const isWishlisted = Boolean(wishlistIds?.has(productId));
    const isPending = isAdding || isRemoving;

    const toggle = () => {
        if (!requireAuth("Log in to save items to your wishlist")) return;
        if (isPending) return;
        if (isWishlisted) remove(productId);
        else add({ productId, variantId });
    };

    return { isWishlisted, toggle, isPending };
};
