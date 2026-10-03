import toast from "react-hot-toast";
import { Heart, ShoppingBag, Package, Truck } from "lucide-react";
import { cloudinaryUrl, cloudinarySrcSet } from "../../utils/cloudinary";
import {
  cleanName,
  formatPrice,
  getProductBadge,
  isComboItem,
  FREE_DELIVERY_MIN,
  LOW_STOCK_LIMIT,
} from "../../utils/product";
import { FOCUS_RING, PINK_BUTTON } from "../../constants/customerTheme";

const BADGE_STYLES = {
  Combo: "bg-[#3b2a8a] text-white",
  New: "bg-[#d6008a] text-white",
  "Free Delivery": "bg-white text-emerald-700 border border-emerald-100",
};

const IMAGE_WIDTHS = [400, 800];

// TODO: replace with the cart / wishlist mutations once those APIs exist
const notifyCartSoon = () =>
  toast("Cart is coming soon. Stay tuned!", {
    id: "cart-coming-soon",
    icon: <ShoppingBag size={18} className="text-[#d6008a]" />,
  });

const notifyWishlistSoon = () =>
  toast("Wishlist is coming soon!", {
    id: "wishlist-coming-soon",
    icon: <Heart size={18} className="text-[#d6008a]" />,
  });

const ProductImage = ({ item, alt, sizes, className }) => (
  <div className={`relative overflow-hidden bg-gradient-to-b from-[#fff5fa] to-[#f5effd] ${className}`}>
    {item.image ? (
      <img
        src={cloudinaryUrl(item.image, 400)}
        srcSet={cloudinarySrcSet(item.image, IMAGE_WIDTHS)}
        sizes={sizes}
        alt={alt}
        width={400}
        height={400}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-contain p-3 mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
      />
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
      className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${BADGE_STYLES[label]}`}
    >
      {label}
    </span>
  ) : null;

const WishlistButton = ({ name }) => (
  <button
    type="button"
    onClick={notifyWishlistSoon}
    aria-label={`Add ${name} to wishlist`}
    title="Add to wishlist"
    className={`absolute top-2 right-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm backdrop-blur-sm hover:text-[#d6008a] transition-colors ${FOCUS_RING}`}
  >
    <Heart size={18} />
  </button>
);

const AddToCartButton = ({ name, inStock, compact = false }) => (
  <button
    type="button"
    onClick={notifyCartSoon}
    disabled={!inStock}
    aria-label={inStock ? `Add ${name} to cart` : `${name} is sold out`}
    className={`inline-flex h-10 flex-shrink-0 items-center justify-center gap-1.5 rounded-full text-[13px] font-bold disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none ${PINK_BUTTON} ${FOCUS_RING} ${
      compact ? "w-10 sm:w-auto sm:px-4" : "px-4"
    }`}
  >
    <ShoppingBag size={15} aria-hidden="true" />
    <span className={compact ? "hidden sm:inline" : ""}>{inStock ? "Add" : "Sold out"}</span>
  </button>
);

const StockNote = ({ stock }) =>
  stock > 0 && stock <= LOW_STOCK_LIMIT ? (
    <p className="text-[11.5px] font-semibold text-rose-500">Only {stock} left</p>
  ) : null;

const SizeChip = ({ size }) =>
  size ? (
    <span className="inline-flex w-fit items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#3b2a8a]">
      Size {size}
    </span>
  ) : null;

/**
 * Storefront item card (one item = one product variant from GET /user/products).
 * layout: "grid" (default), "compact" (horizontal row) or "feature" (wide combo card).
 */
const ProductCard = ({ item, layout = "grid" }) => {
  const name = cleanName(item.name);
  const inStock = item.stock > 0;
  const badge = getProductBadge(item);

  if (layout === "compact") {
    return (
      <article className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-3 hover:shadow-[0_8px_24px_rgba(59,42,138,0.10)] transition-shadow duration-200">
        <ProductImage item={item} alt={name} sizes="96px" className="aspect-square w-24 flex-shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-[#1e1a3a]">{name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="text-[16px] font-extrabold text-[#1e1a3a]">{formatPrice(item.price)}</span>
            <SizeChip size={item.size} />
          </div>
          <StockNote stock={item.stock} />
        </div>
        <AddToCartButton name={name} inStock={inStock} compact />
      </article>
    );
  }

  if (layout === "feature") {
    return (
      <article className="group grid overflow-hidden rounded-3xl border border-pink-100 bg-white p-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] hover:shadow-[0_12px_32px_rgba(214,0,138,0.12)] transition-shadow duration-200">
        <div className="relative">
          <ProductImage
            item={item}
            alt={name}
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 40vw, 100vw"
            className="aspect-square h-full w-full rounded-2xl"
          />
          <Badge label={badge} />
          <WishlistButton name={name} />
        </div>
        <div className="flex flex-col gap-3 p-4 sm:p-6 lg:p-8">
          <span className="w-fit rounded-full bg-[#fff5fa] px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#d6008a]">
            {isComboItem(item) ? "Value Pack" : "Featured"}
          </span>
          <h3 className="text-[20px] font-extrabold leading-snug text-[#1e1a3a] lg:text-[24px]">{name}</h3>
          <p className="max-w-[460px] text-[13.5px] leading-relaxed text-slate-500">
            Stock up once and stay covered all cycle long.
          </p>
          <SizeChip size={item.size} />
          {item.price >= FREE_DELIVERY_MIN && (
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700">
              <Truck size={15} aria-hidden="true" /> Free delivery on this pack
            </p>
          )}
          <StockNote stock={item.stock} />
          <div className="mt-auto flex items-center justify-between gap-3 pt-2 sm:justify-start sm:gap-6">
            <span className="text-[26px] font-extrabold text-[#1e1a3a]">{formatPrice(item.price)}</span>
            <AddToCartButton name={name} inStock={inStock} />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_4px_18px_-12px_rgba(59,42,138,0.18)] hover:-translate-y-1 hover:shadow-[0_14px_30px_-12px_rgba(59,42,138,0.22)] transition-all duration-200">
      <div className="relative">
        <ProductImage
          item={item}
          alt={name}
          sizes="(min-width: 1280px) 280px, (min-width: 640px) 45vw, 75vw"
          className="aspect-square w-full rounded-xl"
        />
        <Badge label={badge} />
        <WishlistButton name={name} />
        {!inStock && (
          <span className="absolute bottom-3 left-3 rounded-full bg-[#1e1a3a]/80 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-white">
            Sold out
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-1.5 pb-1 pt-3.5">
        <SizeChip size={item.size} />
        <h3 className="line-clamp-2 min-h-[2.6rem] text-[14px] font-semibold leading-snug text-[#1e1a3a]">{name}</h3>
        <StockNote stock={item.stock} />
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-[18px] font-extrabold text-[#1e1a3a]">{formatPrice(item.price)}</span>
          <AddToCartButton name={name} inStock={inStock} />
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
