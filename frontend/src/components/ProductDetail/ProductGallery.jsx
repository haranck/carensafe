import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, Package } from "lucide-react";
import { cloudinaryUrl, cloudinarySrcSet } from "../../utils/cloudinary";
import { FOCUS_RING } from "../../constants/customerTheme";

// Same widths as the product cards, so an image already seen on a card comes straight from the browser cache
const MAIN_WIDTH = 800;
const MAIN_WIDTHS = [400, 800, 1200];
const MAIN_SIZES = "(min-width: 640px) 600px, 100vw";
const PLACEHOLDER_WIDTH = 400;
// Uploads are ~1000px wide, so this is effectively full resolution; only requested while zooming
const ZOOM_WIDTH = 1200;
const THUMB_WIDTH = 160;
const SWIPE_MIN_PX = 40;

// Zoom follows the cursor: the pointer position is written to --zoom-x / --zoom-y, the classes stay static
const ZOOM_ORIGIN = "origin-[var(--zoom-x)_var(--zoom-y)]";
const ZOOMED = "scale-[1.6]";

const IMAGE_BACKGROUND = "bg-gradient-to-b from-[#fff5fa] to-[#f5effd]";
const IMAGE_FIT = "absolute inset-0 h-full w-full object-contain p-6 mix-blend-multiply sm:p-10";

const NAV_BUTTON = `absolute top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-pink-100 bg-white/90 text-[#1e1a3a] shadow-[0_6px_18px_rgba(59,42,138,0.12)] backdrop-blur-sm hover:text-[#d6008a] transition-all lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100 ${FOCUS_RING}`;

const mainImageProps = (url) => ({
  src: cloudinaryUrl(url, MAIN_WIDTH),
  srcSet: cloudinarySrcSet(url, MAIN_WIDTHS),
  sizes: MAIN_SIZES,
});

// Warms the browser cache so thumbnail clicks and size switches don't wait on the network
const preloadImages = (urls) => {
  urls.forEach((url) => {
    const img = new Image();
    img.sizes = MAIN_SIZES;
    img.srcset = cloudinarySrcSet(url, MAIN_WIDTHS) || "";
    img.src = cloudinaryUrl(url, MAIN_WIDTH);
  });
};

const toPercent = (offset, size) => `${Math.max(0, Math.min(100, (offset / size) * 100))}%`;

/**
 * Main image + thumbnail strip. The image on screen only changes once the next one has loaded
 * (crossfade, no blank flash); swipe on touch, cursor-following zoom with a mouse.
 * images: URL strings of the selected variant (resets to the first when `variantId` changes).
 * preloadUrls: every image of the product, fetched in the background after the first one shows.
 */
const ProductGallery = ({ images, name, variantId, preloadUrls = [] }) => {
  const [index, setIndex] = useState(0);
  const [lastVariantId, setLastVariantId] = useState(variantId);
  // Image on screen: { url, fade }. The first one swaps in over the placeholder without a fade (same picture, just sharper)
  const [shown, setShown] = useState(null);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomReadyUrl, setZoomReadyUrl] = useState(null);
  const touchStart = useRef(null);

  // New variant → back to its first image (state adjusted during render, no effect needed)
  if (variantId !== lastVariantId) {
    setLastVariantId(variantId);
    setIndex(0);
  }

  const count = images.length;
  const hasMany = count > 1;
  const activeIndex = Math.min(index, Math.max(count - 1, 0));
  const current = images[activeIndex];
  const shownUrl = shown?.url ?? null;
  const shownIndex = images.indexOf(shownUrl);
  const isLoadingNext = Boolean(current) && current !== shownUrl;
  const hasShownImage = shownUrl !== null;

  const showLoaded = (url) => setShown((prev) => ({ url, fade: prev !== null }));

  useEffect(() => {
    if (hasShownImage) preloadImages(preloadUrls);
  }, [hasShownImage, preloadUrls]);

  const go = (step) => setIndex((i) => (i + step + count) % count);

  const updateZoomOrigin = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--zoom-x", toPercent(e.clientX - rect.left, rect.width));
    e.currentTarget.style.setProperty("--zoom-y", toPercent(e.clientY - rect.top, rect.height));
  };

  const handlePointerMove = (e) => {
    if (e.pointerType !== "mouse" || !hasShownImage) return;
    updateZoomOrigin(e);
    // No zoom while the cursor is on the prev/next buttons
    const shouldZoom = !e.target.closest("button");
    if (shouldZoom !== isZooming) setIsZooming(shouldZoom);
  };

  const handleTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || !hasMany) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };

  const zoomClasses = `${ZOOM_ORIGIN} transition-[scale] duration-200 ease-out ${isZooming ? ZOOMED : ""}`;

  return (
    <div>
      <div
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setIsZooming(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`group relative aspect-square w-full touch-pan-y overflow-hidden rounded-3xl border border-pink-100 [--zoom-x:50%] [--zoom-y:50%] ${IMAGE_BACKGROUND} ${
          hasShownImage ? "cursor-zoom-in" : ""
        }`}
      >
        {!current && (
          <div className="absolute inset-0 flex items-center justify-center text-pink-200">
            <Package size={64} aria-hidden="true" />
            <span className="sr-only">No image available for {name}</span>
          </div>
        )}

        {/* First paint: the card-sized image (usually cached from the product card) until the sharp one loads */}
        {current && !hasShownImage && (
          <img src={cloudinaryUrl(current, PLACEHOLDER_WIDTH)} alt="" aria-hidden="true" decoding="async" className={IMAGE_FIT} />
        )}

        <AnimatePresence initial={false}>
          {hasShownImage && (
            <m.img
              key={shownUrl}
              {...mainImageProps(shownUrl)}
              alt={hasMany && shownIndex >= 0 ? `${name}, image ${shownIndex + 1} of ${count}` : name}
              width={MAIN_WIDTH}
              height={MAIN_WIDTH}
              initial={shown.fade ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`${IMAGE_FIT} ${zoomClasses}`}
            />
          )}
        </AnimatePresence>

        {/* Loads the requested image off-screen; it replaces the visible one only when ready */}
        {isLoadingNext && (
          <img
            key={current}
            {...mainImageProps(current)}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            onLoad={() => showLoaded(current)}
            onError={() => showLoaded(current)}
            className="hidden"
          />
        )}

        {/* Full-resolution layer, fetched on the first hover and faded in over the zoomed image */}
        {isZooming && hasShownImage && (
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${IMAGE_BACKGROUND} ${
              zoomReadyUrl === shownUrl ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={cloudinaryUrl(shownUrl, ZOOM_WIDTH)}
              alt=""
              onLoad={() => setZoomReadyUrl(shownUrl)}
              className={`${IMAGE_FIT} ${ZOOM_ORIGIN} ${ZOOMED}`}
            />
          </div>
        )}

        <AnimatePresence>
          {isLoadingNext && (
            <m.span
              role="status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.15 }}
              className="absolute top-3 right-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#d6008a] shadow-sm"
            >
              <Loader2 size={18} aria-hidden="true" className="animate-spin" />
              <span className="sr-only">Loading image…</span>
            </m.span>
          )}
        </AnimatePresence>

        {hasMany && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous image" className={`${NAV_BUTTON} left-3`}>
              <ChevronLeft size={20} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next image" className={`${NAV_BUTTON} right-3`}>
              <ChevronRight size={20} />
            </button>
            <span
              aria-hidden="true"
              className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[#1e1a3a]/70 px-2.5 py-1 text-[11px] font-bold text-white lg:hidden"
            >
              {activeIndex + 1} / {count}
            </span>
          </>
        )}
      </div>

      {hasMany && (
        <ul
          aria-label="Product images"
          className="-mx-1 mt-2 flex gap-2.5 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((url, i) => {
            const isActive = i === activeIndex;
            return (
              <li key={`${i}-${url}`} className="flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show image ${i + 1} of ${count}`}
                  aria-current={isActive ? "true" : undefined}
                  className={`block h-16 w-16 overflow-hidden rounded-xl border-2 transition-colors sm:h-20 sm:w-20 ${IMAGE_BACKGROUND} ${FOCUS_RING} ${
                    isActive ? "border-[#d6008a]" : "border-transparent hover:border-pink-200"
                  }`}
                >
                  <img
                    src={cloudinaryUrl(url, THUMB_WIDTH)}
                    alt=""
                    width={THUMB_WIDTH}
                    height={THUMB_WIDTH}
                    decoding="async"
                    className="h-full w-full object-contain p-1.5 mix-blend-multiply"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ProductGallery;
