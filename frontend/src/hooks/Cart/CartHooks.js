import { createElement } from "react";
import toast from "react-hot-toast";
import { ShoppingBag } from "lucide-react";
import { useRequireAuth } from "../Auth/useRequireAuth";

const notifyCartSoon = () =>
    toast("Cart is coming soon. Stay tuned!", {
        id: "cart-coming-soon",
        icon: createElement(ShoppingBag, { size: 18, className: "text-[#d6008a]" }),
    });

/**
 * Single entry point for cart actions (product cards, product detail page, sticky bar, wishlist page).
 * item: { productId, variantId, quantity }. Every action needs an account: guests go through the login gate
 * (toast + login, then back to this page) and get `null`.
 *
 * TODO: once the cart API exists, back these with a useAddToCart mutation
 * (toast.success + invalidate ["cart"]); buyNow = add, then navigate to FRONTEND_ROUTES.CART;
 * moveToCart = the move-to-cart mutation (adds to the cart, then removes from the wishlist).
 */
export const useCartActions = () => {
    const requireAuth = useRequireAuth();

    const addToCart = (item) => {
        if (!requireAuth("Log in to add items to your cart")) return Promise.resolve(null);
        notifyCartSoon();
        return Promise.resolve(item);
    };

    const buyNow = (item) => {
        if (!requireAuth("Log in to continue to checkout")) return Promise.resolve(null);
        notifyCartSoon();
        return Promise.resolve(item);
    };

    const moveToCart = (item) => {
        if (!requireAuth("Log in to add items to your cart")) return Promise.resolve(null);
        notifyCartSoon();
        return Promise.resolve(item);
    };

    return { addToCart, buyNow, moveToCart, isPending: false };
};
