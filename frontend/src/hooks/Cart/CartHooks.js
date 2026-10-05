import { createElement } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
    addCartItem,
    clearCart,
    getCart,
    getCartCount,
    getCartRecommendations,
    moveCartItemToWishlist,
    removeCartItem,
    updateCartItem,
} from "../../services/Cart/cartService";
import { moveWishlistItemToCart } from "../../services/Wishlist/wishlistService";
import { useRequireAuth } from "../Auth/useRequireAuth";
import { getErrorMessage } from "../../utils/errorMessage";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import CartActionToast from "../../components/Cart/CartActionToast";

const COUNT_STALE_TIME = 60 * 1000;
const UPDATE_ITEM_KEY = ["update_cart_item"];

// Keys carry the user id (like the wishlist), so another account on this browser never sees a cached cart.
// Every cart mutation invalidates the three prefixes.
const cartKey = (userId) => ["cart", userId];
const cartCountKey = (userId) => ["cart_count", userId];
const cartRecommendationsKey = (userId) => ["cart_recommendations", userId];
const CART_PREFIXES = [["cart"], ["cart_count"], ["cart_recommendations"]];
const WISHLIST_PREFIXES = [["wishlist"], ["wishlist_ids"]];

const useCartSession = () => {
    const isLoggedIn = useSelector((s) => Boolean(s.token.accessToken));
    const userId = useSelector((s) => s.auth.user?.id);
    return { isLoggedIn, userId };
};

const errorMessage = (error) => getErrorMessage(error, "Couldn't update your cart. Please try again.");

// Cached cart without one line, or with a new quantity for it (the server's answer replaces it right after)
const withoutLine = (cart, itemId) =>
    cart && { ...cart, data: { ...cart.data, items: cart.data.items.filter((item) => item.itemId !== itemId) } };

const withQuantity = (cart, itemId, quantity) =>
    cart && {
        ...cart,
        data: {
            ...cart.data,
            items: cart.data.items.map((item) =>
                item.itemId === itemId ? { ...item, quantity, lineTotal: item.price * quantity } : item
            ),
        },
    };

const useInvalidate = (prefixes) => {
    const queryClient = useQueryClient();
    return () => Promise.all(prefixes.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
};

// Header badge straight away, before the refetch
const useSetCount = () => {
    const queryClient = useQueryClient();
    const { userId } = useCartSession();
    return (count) => queryClient.setQueryData(cartCountKey(userId), (old) => old && { ...old, data: { count } });
};

// Mutations that answer with the whole cart ({ items, summary }) show it straight away
const useSetCart = () => {
    const queryClient = useQueryClient();
    const { userId } = useCartSession();
    const setCount = useSetCount();
    return (response) => {
        queryClient.setQueryData(cartKey(userId), response);
        setCount(response.data.summary.totalQuantity);
    };
};

// Line removed from the cache at once; restored if the server says no
const useOptimisticRemove = () => {
    const queryClient = useQueryClient();
    const { userId } = useCartSession();
    return {
        onMutate: async (itemId) => {
            await queryClient.cancelQueries({ queryKey: cartKey(userId) });
            const previous = queryClient.getQueryData(cartKey(userId));
            queryClient.setQueryData(cartKey(userId), (cart) => withoutLine(cart, itemId));
            return { previous };
        },
        onError: (error, itemId, context) => {
            if (context?.previous) queryClient.setQueryData(cartKey(userId), context.previous);
            toast.error(errorMessage(error), { id: `cart-error-${itemId}` });
        },
    };
};

// { items, summary }
export const useGetCart = () => {
    const { isLoggedIn, userId } = useCartSession();
    return useQuery({ queryKey: cartKey(userId), queryFn: getCart, enabled: isLoggedIn });
};

// Units in the cart, for the header badge. Logged out → no request, 0.
export const useCartCount = () => {
    const { isLoggedIn, userId } = useCartSession();
    return useQuery({
        queryKey: cartCountKey(userId),
        queryFn: getCartCount,
        enabled: isLoggedIn,
        staleTime: COUNT_STALE_TIME,
        select: (response) => response.data.count,
    });
};

// Product cards for "You May Also Like"
export const useCartRecommendations = () => {
    const { isLoggedIn, userId } = useCartSession();
    return useQuery({ queryKey: cartRecommendationsKey(userId), queryFn: getCartRecommendations, enabled: isLoggedIn });
};

// item: { productId, variantId, quantity? }
export const useAddToCart = () => {
    const setCount = useSetCount();
    const invalidateCart = useInvalidate(CART_PREFIXES);
    return useMutation({
        mutationFn: addCartItem,
        onSuccess: (response) => setCount(response.data.count),
        onError: (error, { variantId }) => toast.error(errorMessage(error), { id: `cart-error-${variantId}` }),
        onSettled: invalidateCart,
    });
};

// { itemId, quantity }: the new quantity shows at once and rolls back on error. With several updates in flight,
// only the last one to finish writes the server's cart, so an older answer never overwrites a newer click.
export const useUpdateCartItem = () => {
    const queryClient = useQueryClient();
    const { userId } = useCartSession();
    const setCart = useSetCart();
    const invalidateCart = useInvalidate(CART_PREFIXES);
    const isLastUpdate = () => queryClient.isMutating({ mutationKey: UPDATE_ITEM_KEY }) === 1;

    return useMutation({
        mutationKey: UPDATE_ITEM_KEY,
        mutationFn: updateCartItem,
        onMutate: async ({ itemId, quantity }) => {
            await queryClient.cancelQueries({ queryKey: cartKey(userId) });
            const previous = queryClient.getQueryData(cartKey(userId));
            queryClient.setQueryData(cartKey(userId), (cart) => withQuantity(cart, itemId, quantity));
            return { previous };
        },
        onError: (error, { itemId }, context) => {
            if (context?.previous) queryClient.setQueryData(cartKey(userId), context.previous);
            toast.error(errorMessage(error), { id: `cart-error-${itemId}` });
        },
        onSuccess: (response) => {
            if (isLastUpdate()) setCart(response);
        },
        onSettled: () => (isLastUpdate() ? invalidateCart() : undefined),
    });
};

// itemId
export const useRemoveCartItem = () => {
    const optimisticRemove = useOptimisticRemove();
    const setCart = useSetCart();
    const invalidateCart = useInvalidate(CART_PREFIXES);
    return useMutation({
        mutationFn: removeCartItem,
        ...optimisticRemove,
        onSuccess: setCart,
        onSettled: invalidateCart,
    });
};

// itemId: leaves the cart at once, lands in the wishlist
export const useMoveToWishlist = () => {
    const optimisticRemove = useOptimisticRemove();
    const setCart = useSetCart();
    const invalidateAll = useInvalidate([...CART_PREFIXES, ...WISHLIST_PREFIXES]);
    return useMutation({
        mutationFn: moveCartItemToWishlist,
        ...optimisticRemove,
        onSuccess: setCart,
        onSettled: invalidateAll,
    });
};

export const useClearCart = () => {
    const setCart = useSetCart();
    const invalidateCart = useInvalidate(CART_PREFIXES);
    return useMutation({
        mutationFn: clearCart,
        onSuccess: setCart,
        onError: (error) => toast.error(errorMessage(error), { id: "cart-error-clear" }),
        onSettled: invalidateCart,
    });
};

// Wishlist "Move to Cart": { itemId (wishlist item), productId, variantId }
export const useMoveToCart = () => {
    const setCount = useSetCount();
    const invalidateAll = useInvalidate([...CART_PREFIXES, ...WISHLIST_PREFIXES]);
    return useMutation({
        mutationFn: moveWishlistItemToCart,
        onSuccess: (response) => setCount(response.data.count),
        onError: (error, { variantId }) => toast.error(errorMessage(error), { id: `cart-error-${variantId}` }),
        onSettled: invalidateAll,
    });
};

const showAddedToast = (message) =>
    toast.success(
        (t) => createElement(CartActionToast, { message, actionLabel: "View cart", to: FRONTEND_ROUTES.CART, toastId: t.id }),
        { id: "cart-added" }
    );

/**
 * Single entry point for cart actions (product cards, product detail page, sticky bar, wishlist page).
 * item: { productId, variantId, quantity } (+ wishlistItemId for Move to Cart). Every action needs an account: guests go through the login gate
 * (toast + login, then back to this page) and get `null`. Failures are toasted by the mutation hooks.
 */
export const useCartActions = () => {
    const requireAuth = useRequireAuth();
    const navigate = useNavigate();
    const { mutateAsync: add, isPending: isAdding } = useAddToCart();
    const { mutateAsync: move, isPending: isMoving } = useMoveToCart();

    const addToCart = (item) => {
        if (!requireAuth("Log in to add items to your cart")) return Promise.resolve(null);
        return add(item)
            .then((response) => {
                showAddedToast("Added to cart");
                return response;
            })
            .catch(() => null);
    };

    // Add, then the cart. A 409 means it's already there (at the limit): go to the cart anyway.
    const buyNow = (item) => {
        if (!requireAuth("Log in to continue to checkout")) return Promise.resolve(null);
        return add(item)
            .then((response) => {
                navigate(FRONTEND_ROUTES.CART);
                return response;
            })
            .catch((error) => {
                if (error?.response?.status === 409) navigate(FRONTEND_ROUTES.CART);
                return null;
            });
    };

    const moveToCart = (item) => {
        if (!requireAuth("Log in to add items to your cart")) return Promise.resolve(null);
        return move({ itemId: item.wishlistItemId, productId: item.productId, variantId: item.variantId })
            .then((response) => {
                showAddedToast("Moved to cart");
                return response;
            })
            .catch(() => null);
    };

    return { addToCart, buyNow, moveToCart, isPending: isAdding || isMoving };
};
