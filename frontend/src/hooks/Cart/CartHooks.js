import { createElement } from "react";
import toast from "react-hot-toast";
import { ShoppingBag } from "lucide-react";

const notifyCartSoon = () =>
    toast("Cart is coming soon. Stay tuned!", {
        id: "cart-coming-soon",
        icon: createElement(ShoppingBag, { size: 18, className: "text-[#d6008a]" }),
    });

/**
 * Single entry point for cart actions (product cards, product detail page, sticky bar).
 * item: { productId, variantId, quantity }
 *
 * TODO: once the cart API exists, back these with a useAddToCart mutation
 * (toast.success + invalidate ["cart"]); buyNow = add, then navigate to FRONTEND_ROUTES.CART.
 */
export const useCartActions = () => {
    const addToCart = (item) => {
        notifyCartSoon();
        return Promise.resolve(item);
    };

    const buyNow = (item) => {
        notifyCartSoon();
        return Promise.resolve(item);
    };

    return { addToCart, buyNow, isPending: false };
};
