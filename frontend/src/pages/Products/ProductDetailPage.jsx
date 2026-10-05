import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { LazyMotion, MotionConfig, domAnimation, m } from "framer-motion";
import Header from "../../components/Layout/Header";
import Footer from "../../components/Layout/Footer";
import SectionError from "../../components/Home/SectionError";
import ProductBreadcrumb from "../../components/ProductDetail/ProductBreadcrumb";
import ProductGallery from "../../components/ProductDetail/ProductGallery";
import ProductInfo from "../../components/ProductDetail/ProductInfo";
import ProductDetailTabs from "../../components/ProductDetail/ProductDetailTabs";
import ProductReviews from "../../components/ProductDetail/ProductReviews";
import SimilarProducts from "../../components/ProductDetail/SimilarProducts";
import StickyPurchaseBar from "../../components/ProductDetail/StickyPurchaseBar";
import ProductDetailSkeleton from "../../components/ProductDetail/ProductDetailSkeleton";
import ProductNotFound from "../../components/ProductDetail/ProductNotFound";
import { useGetProductById } from "../../hooks/Products/ProductHooks";
import { useCartActions } from "../../hooks/Cart/CartHooks";
import { CONTAINER, PAGE_BACKGROUND } from "../../constants/customerTheme";
import { MAX_ORDER_QUANTITY, cleanName } from "../../utils/product";
import { usePageTitle } from "../../hooks/common/usePageTitle";

const NOT_FOUND_STATUSES = [400, 404];

// First in-stock variant, else the first one
const getDefaultVariant = (variants) => variants.find((variant) => variant.stock > 0) || variants[0];

const ProductDetailPage = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const titleId = useId();
  const { data, isLoading, isError, error, isFetching, refetch } = useGetProductById(id);
  const { addToCart, buyNow, isPending } = useCartActions();
  const [quantity, setQuantity] = useState(1);
  const [showStickyBar, setShowStickyBar] = useState(false);

  // New product (e.g. a similar-product click) → quantity back to 1 (state adjusted during render, no effect needed)
  const [lastId, setLastId] = useState(id);
  if (id !== lastId) {
    setLastId(id);
    setQuantity(1);
  }

  const product = data?.data;
  const productName = product ? cleanName(product.name) : "";
  const variants = product?.variants || [];
  const allImages = useMemo(() => (product?.variants || []).flatMap((v) => v.images), [product]);
  // Selected variant lives in ?variant= so refresh/share keeps it; unknown ids fall back to the default
  const variant = variants.find((v) => v._id === searchParams.get("variant")) || getDefaultVariant(variants);
  const maxQuantity = variant ? Math.max(1, Math.min(variant.stock, MAX_ORDER_QUANTITY)) : 1;
  const safeQuantity = Math.min(quantity, maxQuantity);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [id]);

  usePageTitle(productName || "Product");

  // Sticky bar shows once the main purchase buttons have scrolled up out of view
  const actionsRef = useCallback((node) => {
    if (!node) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      setShowStickyBar(false);
    };
  }, []);

  const selectVariant = (variantId) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("variant", variantId);
        return next;
      },
      { replace: true }
    );
    setQuantity(1);
  };

  const lineItem = () => ({ productId: product._id, variantId: variant._id, quantity: safeQuantity });
  const handleAddToCart = () => addToCart(lineItem());
  const handleBuyNow = () => buyNow(lineItem());

  const isLoaded = Boolean(product && variant);

  let content;
  if (isLoading) {
    content = (
      <div className={`${CONTAINER} pt-6 pb-16`}>
        <ProductDetailSkeleton />
      </div>
    );
  } else if (isLoaded) {
    content = (
      <>
        <div className={`${CONTAINER} pt-6 pb-12 md:pb-16`}>
          <ProductBreadcrumb category={product.category} isCombo={product.isCombo} name={product.name} />
          <m.section
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mt-4 grid gap-8 lg:max-w-[1240px] lg:grid-cols-2 lg:gap-12"
          >
            <div className="w-full max-w-[600px] lg:sticky lg:top-28 lg:self-start">
              <ProductGallery
                images={variant.images}
                name={cleanName(variant.name)}
                variantId={variant._id}
                preloadUrls={allImages}
              />
            </div>
            <ProductInfo
              product={product}
              variant={variant}
              titleId={titleId}
              quantity={safeQuantity}
              maxQuantity={maxQuantity}
              onQuantityChange={setQuantity}
              onSelectVariant={selectVariant}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              isPending={isPending}
              actionsRef={actionsRef}
            />
          </m.section>
        </div>

        <ProductDetailTabs product={product} selectedId={variant._id} />
        <ProductReviews />
        <SimilarProducts productId={product._id} />
      </>
    );
  } else if (isError && !NOT_FOUND_STATUSES.includes(error?.response?.status)) {
    content = (
      <div className={`${CONTAINER} pt-10 pb-16`}>
        <SectionError message="We couldn't load this product." onRetry={refetch} isRetrying={isFetching} />
      </div>
    );
  } else {
    content = (
      <div className={`${CONTAINER} pt-10 pb-16`}>
        <ProductNotFound />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans ${PAGE_BACKGROUND}`}>
      <Header />

      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <main className="flex-1 overflow-x-clip">{content}</main>

          {isLoaded && (
            <StickyPurchaseBar
              isVisible={showStickyBar}
              variant={variant}
              quantity={safeQuantity}
              isPending={isPending}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
            />
          )}
        </MotionConfig>
      </LazyMotion>

      <Footer />
      {/* Keeps the page end reachable above the mobile sticky bar (phones; no footer there) */}
      {isLoaded && showStickyBar && <div aria-hidden="true" className="h-20 md:hidden" />}
    </div>
  );
};

export default ProductDetailPage;
