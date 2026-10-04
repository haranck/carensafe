import { useEffect, useId, useLayoutEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LazyMotion, MotionConfig, domAnimation, m } from "framer-motion";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import Header from "../../components/Layout/Header";
import Footer from "../../components/Layout/Footer";
import SectionError from "../../components/Home/SectionError";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import CartItemCard from "../../components/Cart/CartItemCard";
import CartActionToast from "../../components/Cart/CartActionToast";
import CartRecommendations from "../../components/Cart/CartRecommendations";
import CartSkeleton from "../../components/Cart/CartSkeleton";
import EmptyCart from "../../components/Cart/EmptyCart";
import FreeShippingBar from "../../components/Cart/FreeShippingBar";
import MobileCheckoutBar from "../../components/Cart/MobileCheckoutBar";
import OrderSummary from "../../components/Cart/OrderSummary";
import {
  useAddToCart,
  useClearCart,
  useGetCart,
  useMoveToWishlist,
  useRemoveCartItem,
  useUpdateCartItem,
} from "../../hooks/Cart/CartHooks";
import { useWishlistIds } from "../../hooks/Wishlist/WishlistHooks";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { CONTAINER, FOCUS_RING, PAGE_BACKGROUND } from "../../constants/customerTheme";

const UNDO_DURATION = 5000;

const itemsLabel = (count) => `${count} ${count === 1 ? "item" : "items"}`;

const CartPage = () => {
  const headingId = useId();
  const navigate = useNavigate();
  const [isClearOpen, setIsClearOpen] = useState(false);

  const { data, isLoading, isError, isFetching, refetch } = useGetCart();
  const { mutate: updateItem, isPending: isUpdating } = useUpdateCartItem();
  const { mutateAsync: removeItem } = useRemoveCartItem();
  const { mutateAsync: moveToWishlist } = useMoveToWishlist();
  const { mutate: addItem } = useAddToCart();
  const { mutate: clearCart, isPending: isClearing } = useClearCart();
  const { data: wishlistIds } = useWishlistIds();

  const items = data?.data?.items || [];
  const summary = data?.data?.summary;
  const hasItems = items.length > 0;
  // Enabled while at least one line can be ordered (out-of-stock / unavailable lines are left out of the total)
  const canCheckout = Boolean(summary?.itemCount);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "My Cart | Care N Safe";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const handleQuantityChange = (itemId, quantity) => updateItem({ itemId, quantity });

  // Optimistic; available lines get an Undo that adds them back with the same quantity
  const handleRemove = (item) => {
    removeItem(item.itemId)
      .then(() => {
        const toastId = `cart-removed-${item.itemId}`;
        if (!item.isAvailable) {
          toast.success("Removed from your cart", { id: toastId });
          return;
        }
        toast(
          (t) => (
            <CartActionToast
              message="Removed from your cart"
              actionLabel="Undo"
              toastId={t.id}
              onAction={() => addItem({ productId: item.productId, variantId: item.variantId, quantity: item.quantity })}
            />
          ),
          { id: toastId, duration: UNDO_DURATION, icon: <Trash2 size={18} aria-hidden="true" /> }
        );
      })
      // Already rolled back and reported by the mutation hook
      .catch(() => {});
  };

  const handleMoveToWishlist = (item) => {
    moveToWishlist(item.itemId)
      .then(() => toast.success("Moved to your wishlist", { id: `cart-moved-${item.itemId}` }))
      .catch(() => {});
  };

  // Checkout is the next task: the route shows Coming Soon until then
  const handleCheckout = () => navigate(FRONTEND_ROUTES.CHECKOUT);

  const handleClear = () => {
    clearCart(undefined, {
      onSuccess: () => toast.success("Your cart is now empty", { id: "cart-cleared" }),
      onSettled: () => setIsClearOpen(false),
    });
  };

  let content;
  if (isLoading) {
    content = <CartSkeleton />;
  } else if (isError) {
    content = <SectionError message="We couldn't load your cart." onRetry={refetch} isRetrying={isFetching} />;
  } else if (!hasItems) {
    content = <EmptyCart wishlistCount={wishlistIds?.size || 0} />;
  } else {
    content = (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-3">
          <FreeShippingBar summary={summary} />
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.itemId}>
                <CartItemCard
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemove}
                  onMoveToWishlist={handleMoveToWishlist}
                />
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsClearOpen(true)}
              className={`inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors ${FOCUS_RING}`}
            >
              <Trash2 size={15} aria-hidden="true" />
              Clear cart
            </button>
          </div>
        </div>

        <div className="lg:sticky lg:top-28">
          <OrderSummary
            summary={summary}
            canCheckout={canCheckout}
            onCheckout={handleCheckout}
            isUpdating={isUpdating || isFetching}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans ${PAGE_BACKGROUND}`}>
      <Header />

      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <main className="flex-1 overflow-x-clip">
            <section aria-labelledby={headingId} className={`${CONTAINER} pt-8 pb-12`}>
              <div className="mx-auto max-w-[1240px]">
                <m.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <h1
                    id={headingId}
                    className="flex flex-wrap items-baseline gap-x-3 text-[30px] font-extrabold leading-tight tracking-tight text-[#1e1a3a] sm:text-[40px]"
                  >
                    <span>
                      My <span className="font-accent font-medium italic text-[#d6008a]">Cart</span>
                    </span>
                    {hasItems && (
                      <span className="text-[15px] font-semibold tracking-normal text-slate-500 sm:text-[17px]" aria-live="polite">
                        ({itemsLabel(summary.totalQuantity)})
                      </span>
                    )}
                  </h1>

                  <div className="mt-6">{content}</div>
                </m.div>
              </div>
            </section>

            {!isLoading && !isError && <CartRecommendations hasItems={hasItems} />}
          </main>

          {hasItems && (
            <MobileCheckoutBar
              total={summary.total}
              itemCount={summary.itemCount}
              canCheckout={canCheckout}
              onCheckout={handleCheckout}
            />
          )}
        </MotionConfig>
      </LazyMotion>

      <Footer />
      {/* Keeps the end of the footer reachable above the mobile checkout bar */}
      {hasItems && <div aria-hidden="true" className="h-20 bg-[#2c265a] lg:hidden" />}

      <ConfirmDialog
        open={isClearOpen}
        title="Clear your cart?"
        description={`This removes all ${itemsLabel(summary?.totalQuantity || 0)} from your cart.`}
        confirmLabel="Clear cart"
        icon={Trash2}
        isPending={isClearing}
        onConfirm={handleClear}
        onCancel={() => setIsClearOpen(false)}
      />
    </div>
  );
};

export default CartPage;
