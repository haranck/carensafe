import { useCallback, useEffect, useId, useLayoutEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LazyMotion, MotionConfig, domAnimation, m } from "framer-motion";
import toast from "react-hot-toast";
import { ChevronRight, Heart, HeartOff, ShoppingBag } from "lucide-react";
import Header from "../../components/Layout/Header";
import Footer from "../../components/Layout/Footer";
import ProductCard from "../../components/Products/ProductCard";
import ProductCardSkeleton from "../../components/Products/ProductCardSkeleton";
import SectionError from "../../components/Home/SectionError";
import ShopPagination from "../../components/Shop/ShopPagination";
import { useAddToWishlist, useGetWishlist, useRemoveFromWishlist } from "../../hooks/Wishlist/WishlistHooks";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { CONTAINER, FOCUS_RING, PAGE_BACKGROUND, PINK_BUTTON } from "../../constants/customerTheme";

const PAGE_SIZE = 12;
const SKELETON_COUNT = 6;
const UNDO_DURATION = 5000;
// 1 per row on phones, 2 on tablets, 3 from laptops (the page is capped at 1240px so cards stay a sensible size)
const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5";

const WishlistBreadcrumb = () => (
  <nav aria-label="Breadcrumb">
    <ol className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500">
      <li className="flex items-center gap-1.5">
        <Link
          to={FRONTEND_ROUTES.HOME}
          className={`inline-flex min-h-10 items-center rounded-md hover:text-[#d6008a] transition-colors ${FOCUS_RING}`}
        >
          Home
        </Link>
        <ChevronRight size={14} aria-hidden="true" className="text-slate-300" />
      </li>
      <li aria-current="page" className="font-semibold text-[#1e1a3a]">
        Wishlist
      </li>
    </ol>
  </nav>
);

const EmptyState = () => (
  <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-pink-200 bg-white px-6 py-14 text-center sm:py-20">
    <span className="mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-[#fff5fa]">
      <Heart size={44} strokeWidth={1.6} aria-hidden="true" className="fill-pink-100 text-pink-300" />
    </span>
    <p className="text-[18px] font-extrabold text-[#1e1a3a]">Your wishlist is empty</p>
    <p className="max-w-[340px] text-[13.5px] leading-relaxed text-slate-500">Save products you love and find them here</p>
    <Link
      to={FRONTEND_ROUTES.SHOP}
      className={`mt-4 inline-flex h-11 items-center gap-2 rounded-full px-6 text-[14px] font-bold ${PINK_BUTTON} ${FOCUS_RING}`}
    >
      <ShoppingBag size={16} aria-hidden="true" />
      Start Shopping
    </Link>
  </div>
);

// Message for the dark AppToast body
const UndoToast = ({ onUndo }) => (
  <span className="flex items-center justify-between gap-3">
    <span>Removed from your wishlist</span>
    <button
      type="button"
      onClick={onUndo}
      className="inline-flex h-9 flex-shrink-0 items-center rounded-full bg-[#fff5fa] px-3.5 text-[13px] font-bold text-[#d6008a] hover:bg-pink-100 hover:text-[#9d0063] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6008a]/30"
    >
      Undo
    </button>
  </span>
);

const WishlistPage = () => {
  const headingId = useId();
  const gridTopRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);

  const { data, isLoading, isError, isFetching, isPlaceholderData, refetch } = useGetWishlist(page, PAGE_SIZE);
  const { mutateAsync: removeItem } = useRemoveFromWishlist();
  const { mutate: addItem } = useAddToWishlist();

  const items = data?.data || [];
  const total = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || 0;

  // The page number lives in ?page= so refresh and back keep it (page 1 stays out of the URL)
  const goToPage = useCallback(
    (nextPage, { replace = false } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (nextPage > 1) next.set("page", String(nextPage));
          else next.delete("page");
          return next;
        },
        { replace }
      );
    },
    [setSearchParams]
  );

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "My Wishlist | Care N Safe";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  // Past the last page (a stale link, or the last item on this page was removed) → last page
  useEffect(() => {
    if (data && !isPlaceholderData && page > 1 && page > totalPages) {
      goToPage(totalPages, { replace: true });
    }
  }, [data, isPlaceholderData, page, totalPages, goToPage]);

  // Optimistic (the card disappears at once); the toast offers Undo, which saves it again
  const handleRemove = useCallback(
    (item) => {
      removeItem({ itemId: item.wishlistItemId, productId: item._id, variantId: item.defaultVariant._id })
        .then(() => {
          if (item.isAvailable === false) {
            toast.success("Removed from your wishlist", { id: `wishlist-removed-${item.wishlistItemId}` });
            return;
          }
          toast(
            (t) => (
              <UndoToast
                onUndo={() => {
                  toast.dismiss(t.id);
                  addItem({ productId: item._id, variantId: item.defaultVariant._id });
                }}
              />
            ),
            {
              id: `wishlist-removed-${item.wishlistItemId}`,
              duration: UNDO_DURATION,
              icon: <HeartOff size={18} aria-hidden="true" />,
            }
          );
        })
        // Already rolled back and reported by the mutation hook
        .catch(() => {});
    },
    [removeItem, addItem]
  );

  const handlePageChange = (nextPage) => {
    goToPage(nextPage);
    gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  let content;
  if (isLoading) {
    content = (
      <div className={GRID} aria-busy="true">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  } else if (isError) {
    content = <SectionError message="We couldn't load your wishlist." onRetry={refetch} isRetrying={isFetching} />;
  } else if (total === 0) {
    content = <EmptyState />;
  } else {
    content = (
      <>
        <ul className={`${GRID} transition-opacity duration-200 ${isPlaceholderData ? "opacity-60" : "opacity-100"}`}>
          {items.map((item) => (
            <li key={item.wishlistItemId}>
              <ProductCard item={item} mode="wishlist" onRemove={handleRemove} />
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <ShopPagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      </>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans ${PAGE_BACKGROUND}`}>
      <Header />

      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <main className="flex-1 overflow-x-clip">
            <section aria-labelledby={headingId} className={`${CONTAINER} pt-6 pb-16`}>
              <div className="mx-auto max-w-[1240px]">
                <WishlistBreadcrumb />

                <m.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <div className="mt-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                    <div>
                      <span className="inline-flex items-center rounded-full border border-pink-100 bg-white px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#d6008a]">
                        Saved for Later
                      </span>
                      <h1
                        id={headingId}
                        className="mt-3 text-[30px] font-extrabold leading-tight tracking-tight text-[#1e1a3a] sm:text-[40px]"
                      >
                        My <span className="font-accent font-medium italic text-[#d6008a]">Wishlist</span>
                      </h1>
                    </div>
                    {total > 0 && (
                      <p className="text-[14px] font-semibold text-slate-500" aria-live="polite">
                        <span className="text-[#1e1a3a]">{total}</span> {total === 1 ? "item" : "items"}
                      </p>
                    )}
                  </div>

                  <div ref={gridTopRef} className="mt-8 scroll-mt-28">
                    {content}
                  </div>
                </m.div>
              </div>
            </section>
          </main>
        </MotionConfig>
      </LazyMotion>

      <Footer />
    </div>
  );
};

export default WishlistPage;
