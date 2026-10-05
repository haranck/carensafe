import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Package, Trash2, Truck, Zap } from "lucide-react";
import WishlistButton, { WishlistHeartButton } from "../common/WishlistButton";
import { useCartActions } from "../../hooks/Cart/CartHooks";
import { usePrefetchProduct } from "../../hooks/Products/ProductHooks";
import { productDetailPath } from "../../constants/frontendRoutes";
import { cloudinaryUrl, cloudinarySrcSet } from "../../utils/cloudinary";
import { formatPrice, getProductBadge, isComboItem, productTitle, FREE_DELIVERY_MIN, LOW_STOCK_LIMIT } from "../../utils/product";
import { BRAND_GRADIENT, FOCUS_RING, PINK_BUTTON } from "../../constants/customerTheme";

const BADGE_STYLES = {
  "Out of stock": "bg-[#1e1a3a]/85 text-white",
  Combo: "bg-[#3b2a8a] text-white",
  New: "bg-[#d6008a] text-white",
  "Free Delivery": "bg-white text-emerald-700 border border-emerald-100",
};

const IMAGE_WIDTHS = [400, 800];
const IMAGE_FIT = "absolute inset-0 h-full w-full object-contain p-3 mix-blend-multiply";
const IMAGE_BACKGROUND = "bg-gradient-to-b from-[#fff5fa] to-[#f5effd]";

const ACTION_BUTTON = `relative z-10 inline-flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-1.5 text-[12px] font-bold transition-all duration-200 active:scale-[0.97] ${FOCUS_RING}`;
const OUTLINE_BUTTON = "border-2 border-[#d6008a] bg-white text-[#d6008a] hover:border-[#9d0063] hover:bg-[#fff5fa] hover:text-[#9d0063]";
const GRADIENT_BUTTON = `${BRAND_GRADIENT} text-white shadow-[0_4px_14px_rgba(124,58,237,0.25)] hover:brightness-110`;
const HEART_POSITION = "absolute top-2 right-2 z-10";
// Wishlist cards: one row on phones (compact Move to Cart + icon-only Remove), stacked full-width buttons from sm
const WISHLIST_BUTTON = `relative z-10 inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 text-[11.5px] font-bold transition-all duration-200 active:scale-[0.97] sm:h-10 sm:w-full sm:flex-none sm:text-[12px] ${FOCUS_RING}`;

// Card buttons sit inside the card's link overlay: stop them from also opening the detail page
const stopCardClick = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

// The title link stretches over the whole card (::after overlay); the card's buttons sit above it (z-10).
// Hover / focus / touch prefetches the detail data so the page opens without waiting for the API.
const CardLink = ({ to, overlayRadius, onIntent, children }) => (
  <Link
    to={to}
    onMouseEnter={onIntent}
    onFocus={onIntent}
    onTouchStart={onIntent}
    className={`after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-[#d6008a]/30 ${overlayRadius}`}
  >
    {children}
  </Link>
);

// Second image fades in on hover (mouse only); it's only requested after the first hover
const ProductImage = ({ image, hoverImage, showHover, alt, sizes, className }) => (
  <div className={`relative overflow-hidden ${IMAGE_BACKGROUND} ${className}`}>
    {image ? (
      <>
        <img
          src={cloudinaryUrl(image, 400)}
          srcSet={cloudinarySrcSet(image, IMAGE_WIDTHS)}
          sizes={sizes}
          alt={alt}
          width={400}
          height={400}
          loading="lazy"
          decoding="async"
          className={`${IMAGE_FIT} transition-transform duration-300 group-hover:scale-105`}
        />
        {hoverImage && showHover && (
          // Opaque, isolated layer so the multiply blend doesn't show the first image through it
          <div
            aria-hidden="true"
            className={`absolute inset-0 isolate opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${IMAGE_BACKGROUND}`}
          >
            <img
              src={cloudinaryUrl(hoverImage, 400)}
              srcSet={cloudinarySrcSet(hoverImage, IMAGE_WIDTHS)}
              sizes={sizes}
              alt=""
              width={400}
              height={400}
              decoding="async"
              className={`${IMAGE_FIT} transition-transform duration-300 group-hover:scale-105`}
            />
          </div>
        )}
      </>
    ) : (
      <div className="absolute inset-0 flex items-center justify-center text-pink-200">
        <Package size={40} aria-hidden="true" />
      </div>
    )}
  </div>
);

const Badge = ({ label }) =>
  label ? (
    <span
      className={`absolute top-2 left-2 max-w-[calc(100%-3.75rem)] truncate rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider @min-[12rem]:top-3 @min-[12rem]:left-3 @min-[12rem]:px-2.5 @min-[12rem]:py-1 @min-[12rem]:text-[10px] ${BADGE_STYLES[label]}`}
    >
      {label}
    </span>
  ) : null;

// Add to Cart + Buy Now, sized by the card's own width (container queries): stacked on very small cards,
// "Add" on narrow ones, "Add to Cart" from ~11rem, icons from ~14rem
const CardActions = ({ name, inStock, onAdd, onBuy }) =>
  inStock ? (
    <div className="grid grid-cols-1 gap-1.5 @min-[8.5rem]:grid-cols-2">
      <button type="button" onClick={onAdd} aria-label={`Add ${name} to cart`} className={`${ACTION_BUTTON} ${OUTLINE_BUTTON}`}>
        <ShoppingBag size={15} aria-hidden="true" className="hidden @min-[14rem]:block" />
        <span className="@min-[11rem]:hidden">Add</span>
        <span className="hidden @min-[11rem]:inline">Add to Cart</span>
      </button>
      <button type="button" onClick={onBuy} aria-label={`Buy ${name} now`} className={`${ACTION_BUTTON} ${GRADIENT_BUTTON}`}>
        <Zap size={15} aria-hidden="true" className="hidden fill-white/30 @min-[14rem]:block" />
        Buy Now
      </button>
    </div>
  ) : (
    <button type="button" disabled className={`${ACTION_BUTTON} cursor-not-allowed bg-slate-100 text-slate-500`}>
      Out of stock
    </button>
  );

const CompactAddButton = ({ name, inStock, onAdd }) => (
  <button
    type="button"
    onClick={onAdd}
    disabled={!inStock}
    aria-label={inStock ? `Add ${name} to cart` : `${name} is out of stock`}
    className={`relative z-10 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center gap-1.5 rounded-full text-[13px] font-bold disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none sm:w-auto sm:px-4 ${PINK_BUTTON} ${FOCUS_RING}`}
  >
    <ShoppingBag size={15} aria-hidden="true" />
    <span className="hidden sm:inline">{inStock ? "Add" : "Sold out"}</span>
  </button>
);

// Wishlist page: Move to Cart (or why it can't be bought) + Remove
const WishlistActions = ({ name, isAvailable, inStock, onMove, onRemove }) => (
  <div className="flex items-center gap-1.5 sm:flex-col sm:items-stretch sm:gap-1">
    {!isAvailable && (
      <p className="flex h-9 min-w-0 flex-1 items-center justify-center truncate rounded-full bg-slate-100 px-2 text-[11px] font-bold text-slate-500 sm:h-10 sm:flex-none sm:text-[12px]">
        <span className="sm:hidden">Unavailable</span>
        <span className="hidden sm:inline">No longer available</span>
      </p>
    )}
    {isAvailable && inStock && (
      <button type="button" onClick={onMove} aria-label={`Move ${name} to cart`} className={`${WISHLIST_BUTTON} ${GRADIENT_BUTTON}`}>
        <ShoppingBag size={15} aria-hidden="true" className="hidden sm:block" />
        Move to Cart
      </button>
    )}
    {isAvailable && !inStock && (
      <button type="button" disabled className={`${WISHLIST_BUTTON} cursor-not-allowed bg-slate-100 text-slate-500`}>
        Out of stock
      </button>
    )}
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${name} from wishlist`}
      title="Remove"
      className={`relative z-10 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center gap-1.5 rounded-full border border-slate-200 text-[12.5px] font-semibold text-slate-500 hover:bg-[#fff5fa] hover:text-[#d6008a] transition-colors sm:h-10 sm:w-auto sm:border-0 ${FOCUS_RING}`}
    >
      <Trash2 size={14} aria-hidden="true" />
      <span className="hidden sm:inline">Remove</span>
    </button>
  </div>
);

const StockNote = ({ stock }) =>
  stock > 0 && stock <= LOW_STOCK_LIMIT ? (
    <p className="text-[11.5px] font-semibold text-rose-500">Only {stock} left</p>
  ) : null;

// Wishlist cards: the saved size, e.g. "Size XL · 10 pieces"
const SavedVariant = ({ variant }) => {
  const text = [variant.size && `Size ${variant.size}`, variant.pieces && `${variant.pieces} pieces`].filter(Boolean).join(" · ");
  return text ? <p className="text-[12px] font-bold text-[#3b2a8a]">{text}</p> : null;
};

const SizeChips = ({ sizes }) =>
  sizes?.length ? (
    <ul aria-label="Available sizes" className="flex flex-wrap gap-1">
      {sizes.map((size) => (
        <li key={size} className="rounded-full bg-violet-50 px-2 py-0.5 text-[10.5px] font-semibold text-[#3b2a8a]">
          {size}
        </li>
      ))}
    </ul>
  ) : null;

// "from ₹220" when the matching variants differ in price
const Price = ({ item, className = "text-[18px]" }) => (
  <p className="flex items-baseline gap-1">
    {item.minPrice !== item.maxPrice && <span className="text-[12px] font-semibold text-slate-500">from</span>}
    <span className={`font-extrabold text-[#1e1a3a] ${className}`}>{formatPrice(item.minPrice)}</span>
  </p>
);

/**
 * Storefront product card (one item = one product from GET /user/products, with its default variant).
 * layout: "grid" (default), "compact" (horizontal row) or "feature" (wide combo card).
 * mode "wishlist" (grid only, items from GET /user/wishlist, one per saved variant): filled heart and Remove both call
 * `onRemove(item)`,
 * Move to Cart replaces Add / Buy, and `isAvailable: false` items are greyed out with only Remove.
 */
const ProductCard = ({ item, layout = "grid", mode = "shop", onRemove }) => {
  const { addToCart, buyNow, moveToCart } = useCartActions();
  const prefetchProduct = usePrefetchProduct();
  const [hasHovered, setHasHovered] = useState(false);

  const isWishlistMode = mode === "wishlist";
  const isAvailable = item.isAvailable !== false;
  const variant = item.defaultVariant;
  const [image, hoverImage] = variant.images || [];
  // Product + variant name; a product deleted from the catalogue has no name left
  const name = productTitle(item.name, variant.name) || "Unavailable product";
  const inStock = item.inStock;
  const badge = isAvailable ? getProductBadge({ ...item, price: variant.price }) : null;
  const detailPath = productDetailPath(item._id, variant._id);
  const lineItem = { productId: item._id, variantId: variant._id, quantity: 1 };

  const handleIntent = () => prefetchProduct(item._id);
  const handlePointerEnter = (e) => {
    if (e.pointerType === "mouse" && !hasHovered) setHasHovered(true);
  };
  const handleAdd = (e) => {
    stopCardClick(e);
    addToCart(lineItem);
  };
  const handleBuy = (e) => {
    stopCardClick(e);
    buyNow(lineItem);
  };
  // Adds one of this saved size to the cart, then removes only this wishlist item (see useCartActions)
  const handleMove = (e) => {
    stopCardClick(e);
    moveToCart({ ...lineItem, wishlistItemId: item.wishlistItemId });
  };
  const handleRemove = (e) => {
    stopCardClick(e);
    onRemove(item);
  };

  const heart = isWishlistMode ? (
    <WishlistHeartButton isWishlisted onClick={() => onRemove(item)} name={name} compact className={HEART_POSITION} />
  ) : (
    <WishlistButton productId={item._id} variantId={variant._id} name={name} compact className={HEART_POSITION} />
  );

  if (layout === "compact") {
    return (
      <article className="group relative flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-3 hover:shadow-[0_8px_24px_rgba(214,0,138,0.10)] transition-shadow duration-200">
        <ProductImage image={image} alt={name} sizes="96px" className="aspect-square w-24 flex-shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-[#1e1a3a]">
            <CardLink to={detailPath} onIntent={handleIntent} overlayRadius="after:rounded-2xl">
              {name}
            </CardLink>
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Price item={item} className="text-[16px]" />
            <SizeChips sizes={item.sizes} />
          </div>
          <StockNote stock={variant.stock} />
        </div>
        <CompactAddButton name={name} inStock={inStock} onAdd={handleAdd} />
      </article>
    );
  }

  if (layout === "feature") {
    return (
      <article
        onPointerEnter={handlePointerEnter}
        className="@container group relative grid overflow-hidden rounded-3xl border border-pink-100 bg-white p-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] hover:shadow-[0_12px_32px_rgba(214,0,138,0.12)] transition-shadow duration-200"
      >
        <div className="relative">
          <ProductImage
            image={image}
            hoverImage={hoverImage}
            showHover={hasHovered}
            alt={name}
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 40vw, 100vw"
            className="aspect-square h-full w-full rounded-2xl"
          />
          <Badge label={badge} />
          {heart}
        </div>
        <div className="flex flex-col gap-3 p-4 sm:p-6 lg:p-8">
          <span className="w-fit rounded-full bg-[#fff5fa] px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#d6008a]">
            {isComboItem(item) ? "Value Pack" : "Featured"}
          </span>
          <h3 className="text-[20px] font-extrabold leading-snug text-[#1e1a3a] lg:text-[24px]">
            <CardLink to={detailPath} onIntent={handleIntent} overlayRadius="after:rounded-3xl">
              {name}
            </CardLink>
          </h3>
          <p className="max-w-[460px] text-[13.5px] leading-relaxed text-slate-500">
            Stock up once and stay covered all cycle long.
          </p>
          <SizeChips sizes={item.sizes} />
          {variant.price >= FREE_DELIVERY_MIN && (
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700">
              <Truck size={15} aria-hidden="true" /> Free delivery on this pack
            </p>
          )}
          <StockNote stock={variant.stock} />
          <div className="mt-auto flex flex-col gap-3 pt-2">
            <Price item={item} className="text-[26px]" />
            <div className="w-full max-w-[360px]">
              <CardActions name={name} inStock={inStock} onAdd={handleAdd} onBuy={handleBuy} />
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onPointerEnter={handlePointerEnter}
      className="@container group relative flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_4px_18px_-12px_rgba(59,42,138,0.18)] hover:-translate-y-1 hover:shadow-[0_14px_30px_-12px_rgba(214,0,138,0.25)] transition-all duration-200 sm:p-2.5"
    >
      <div className="relative">
        <ProductImage
          image={image}
          hoverImage={hoverImage}
          showHover={hasHovered}
          alt={name}
          sizes={
            isWishlistMode
              ? "(min-width: 1024px) 400px, 50vw"
              : "(min-width: 1280px) 280px, (min-width: 640px) 30vw, 50vw"
          }
          className={`w-full rounded-xl ${isWishlistMode ? "aspect-[5/4] sm:aspect-square" : "aspect-square"} ${isAvailable ? "" : "opacity-50 grayscale"}`}
        />
        <Badge label={badge} />
        {heart}
      </div>
      <div className={`flex flex-1 flex-col gap-1.5 px-1 pb-0.5 ${isWishlistMode ? "pt-2 sm:pt-3" : "pt-3"}`}>
        {isWishlistMode ? (
          <div className="hidden sm:block">
            <SavedVariant variant={variant} />
          </div>
        ) : (
          isAvailable && <SizeChips sizes={item.sizes} />
        )}
        <h3
          className={`text-[13px] font-semibold leading-snug text-[#1e1a3a] @min-[12rem]:text-[14px] ${
            isWishlistMode ? "line-clamp-1 sm:line-clamp-2 sm:min-h-[2.75em]" : "line-clamp-2 min-h-[2.75em]"
          }`}
        >
          {isAvailable ? (
            <CardLink to={detailPath} onIntent={handleIntent} overlayRadius="after:rounded-2xl">
              {name}
            </CardLink>
          ) : (
            <span className="text-slate-400">{name}</span>
          )}
        </h3>
        {/* Wishlist on phones: the saved size and the price share one line */}
        {isWishlistMode && (
          <div className="flex min-w-0 items-center justify-between gap-2 sm:hidden">
            <span className="truncate text-[11.5px] font-bold text-[#3b2a8a]">{variant.size ? `Size ${variant.size}` : ""}</span>
            {isAvailable && <span className="flex-shrink-0 text-[15px] font-extrabold text-[#1e1a3a]">{formatPrice(item.minPrice)}</span>}
          </div>
        )}
        {isAvailable && <StockNote stock={variant.stock} />}
        <div className={`mt-auto flex flex-col pt-1 ${isWishlistMode ? "gap-2 sm:gap-2.5" : "gap-2.5"}`}>
          {isAvailable && (
            <div className={isWishlistMode ? "hidden sm:block" : undefined}>
              <Price item={item} className="text-[16px] @min-[12rem]:text-[18px]" />
            </div>
          )}
          {isWishlistMode ? (
            <WishlistActions
              name={name}
              isAvailable={isAvailable}
              inStock={inStock}
              onMove={handleMove}
              onRemove={handleRemove}
            />
          ) : (
            <CardActions name={name} inStock={inStock} onAdd={handleAdd} onBuy={handleBuy} />
          )}
        </div>
      </div>
    </article>
  );
};

export default memo(ProductCard);
