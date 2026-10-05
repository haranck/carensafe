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

// Wishlist items are per variant (size). Lookups use "productId:variantId" (product is part of the key because some
// products share variant ids).
export const wishlistKeyOf = (productId, variantId) => `${productId}:${variantId}`;

// Module-level so React Query keeps the same Map between renders until the data changes.
// Map "productId:variantId" → wishlist item id (null while an add is on its way); `.size` is the item count.
const toKeyMap = (response) => new Map(response.data.map((entry) => [wishlistKeyOf(entry.productId, entry.variantId), entry.itemId]));

const samePair = (entry, productId, variantId) => entry.productId === productId && entry.variantId === variantId;

const withPair = (ids, { productId, variantId, itemId = null }) =>
    ids && !ids.data.some((entry) => samePair(entry, productId, variantId))
        ? { ...ids, data: [...ids.data, { itemId, productId, variantId }] }
        : ids;
const withoutPair = (ids, { productId, variantId }) =>
    ids && { ...ids, data: ids.data.filter((entry) => !samePair(entry, productId, variantId)) };
const withItemId = (ids, { productId, variantId, itemId }) =>
    ids && { ...ids, data: ids.data.map((entry) => (samePair(entry, productId, variantId) ? { ...entry, itemId } : entry)) };

// One cached list page without the item; the refetch afterwards fills the page back up
const withoutItem = (page, itemId) =>
    page && {
        ...page,
        data: page.data.filter((item) => item.wishlistItemId !== itemId),
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

// Map of saved variants ("productId:variantId" → item id) for heart states and the header count (`.size`).
// Logged out → no request, no data.
export const useWishlistIds = () => {
    const { isLoggedIn, userId } = useWishlistSession();
    return useQuery({
        queryKey: wishlistIdsKey(userId),
        queryFn: getWishlistIds,
        enabled: isLoggedIn,
        staleTime: IDS_STALE_TIME,
        select: toKeyMap,
    });
};

// pair: { productId, variantId }. Only that size's heart turns red straight away; rolls back if the server says no.
export const useAddToWishlist = () => {
    const queryClient = useQueryClient();
    const { userId } = useWishlistSession();
    const invalidateWishlist = useInvalidateWishlist();

    return useMutation({
        mutationFn: addToWishlist,
        onMutate: async (pair) => {
            await queryClient.cancelQueries({ queryKey: wishlistIdsKey(userId) });
            queryClient.setQueryData(wishlistIdsKey(userId), (ids) => withPair(ids, pair));
        },
        // The new item id, so the heart can remove it again before the refetch lands
        onSuccess: (response, pair) =>
            queryClient.setQueryData(wishlistIdsKey(userId), (ids) => withItemId(ids, { ...pair, itemId: String(response.data.itemId) })),
        onError: (error, pair) => {
            queryClient.setQueryData(wishlistIdsKey(userId), (ids) => withoutPair(ids, pair));
            toast.error(errorMessage(error), { id: `wishlist-error-${wishlistKeyOf(pair.productId, pair.variantId)}` });
        },
        onSettled: invalidateWishlist,
    });
};

// item: { itemId, productId, variantId }. Removes that size from the ids and every cached list page straight away;
// restores them if the server says no.
export const useRemoveFromWishlist = () => {
    const queryClient = useQueryClient();
    const { userId } = useWishlistSession();
    const invalidateWishlist = useInvalidateWishlist();

    return useMutation({
        mutationFn: removeFromWishlist,
        onMutate: async (item) => {
            await Promise.all([
                queryClient.cancelQueries({ queryKey: wishlistIdsKey(userId) }),
                queryClient.cancelQueries({ queryKey: wishlistKey(userId) }),
            ]);
            const previousPages = queryClient.getQueriesData({ queryKey: wishlistKey(userId) });
            queryClient.setQueryData(wishlistIdsKey(userId), (ids) => withoutPair(ids, item));
            queryClient.setQueriesData({ queryKey: wishlistKey(userId) }, (page) => withoutItem(page, item.itemId));
            return { previousPages };
        },
        onError: (error, item, context) => {
            queryClient.setQueryData(wishlistIdsKey(userId), (ids) => withPair(ids, item));
            context?.previousPages.forEach(([queryKey, page]) => queryClient.setQueryData(queryKey, page));
            toast.error(errorMessage(error), { id: `wishlist-error-${item.itemId}` });
        },
        onSettled: invalidateWishlist,
    });
};

/**
 * Shared heart logic for product cards and the detail page, for ONE variant (size) of a product.
 * Guests go through the login gate (toast + login, then back to this page after logging in).
 */
export const useWishlistToggle = (productId, variantId) => {
    const requireAuth = useRequireAuth();
    const { data: wishlistIds } = useWishlistIds();
    const { mutate: add, isPending: isAdding } = useAddToWishlist();
    const { mutate: remove, isPending: isRemoving } = useRemoveFromWishlist();

    const key = wishlistKeyOf(productId, variantId);
    const isWishlisted = Boolean(wishlistIds?.has(key));
    const itemId = wishlistIds?.get(key);
    // Saved a moment ago and the item id isn't back yet: wait for it before allowing a remove
    const isPending = isAdding || isRemoving || (isWishlisted && !itemId);

    const toggle = () => {
        if (!requireAuth("Log in to save items to your wishlist")) return;
        if (isPending) return;
        if (isWishlisted) remove({ itemId, productId, variantId });
        else add({ productId, variantId });
    };

    return { isWishlisted, toggle, isPending };
};
