import { Heart, Leaf, ShieldCheck, Sparkles, Truck } from "lucide-react";
import VariantSelector from "./VariantSelector";
import QuantityStepper from "./QuantityStepper";
import PurchaseButtons from "./PurchaseButtons";
import RatingStars from "./RatingStars";
import WishlistButton from "../common/WishlistButton";
import { useWishlistIds, wishlistKeyOf } from "../../hooks/Wishlist/WishlistHooks";
import { FOCUS_RING } from "../../constants/customerTheme";
import { DUMMY_RATING_SUMMARY } from "../../constants/dummyReviews";
import {
  CATEGORY_LABELS,
  FREE_DELIVERY_MIN,
  LOW_STOCK_LIMIT,
  formatPrice,
  getProductBadges,
  productTitle,
} from "../../utils/product";

const BADGE_STYLES = {
  Combo: "bg-[#3b2a8a] text-white",
  New: "bg-[#d6008a] text-white",
  "Free Delivery": "border border-emerald-100 bg-emerald-50 text-emerald-700",
};

const TRUST_ITEMS = [
  { icon: Truck, label: `Free delivery above ${formatPrice(FREE_DELIVERY_MIN)}` },
  { icon: Leaf, label: "100% Organic Cotton" },
  { icon: Sparkles, label: "Rash-Free Comfort" },
  { icon: ShieldCheck, label: "Secure Payment" },
];

// TODO: dummy summary; replace with the product's real rating once the reviews API exists
const RatingSummaryLink = ({ average, total }) => (
  <a
    href="#reviews"
    aria-label={`Rated ${average} out of 5 from ${total} ratings. See reviews`}
    className={`group mt-3 inline-flex min-h-10 items-center gap-2 rounded-md text-[13px] ${FOCUS_RING}`}
  >
    <RatingStars rating={average} size={15} />
    <span className="font-bold text-[#1e1a3a]">{average.toFixed(1)}</span>
    <span className="font-medium text-slate-500 group-hover:text-[#d6008a] transition-colors">({total} ratings)</span>
  </a>
);

const StockStatus = ({ stock }) => {
  if (stock <= 0) {
    return (
      <p className="flex items-center gap-2 text-[13px] font-bold text-rose-600">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-rose-500" /> Out of stock
      </p>
    );
  }
  if (stock <= LOW_STOCK_LIMIT) {
    return (
      <p className="flex items-center gap-2 text-[13px] font-bold text-rose-500">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-rose-400" /> Only {stock} left, order soon
      </p>
    );
  }
  return (
    <p className="flex items-center gap-2 text-[13px] font-bold text-emerald-700">
      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-500" /> In stock
    </p>
  );
};

/**
 * Right-hand column: title, price, size pills, quantity and purchase buttons.
 * `actionsRef` marks the buttons so the page can show the mobile sticky bar once they scroll away.
 */
const joinSizes = (sizes) => (sizes.length > 1 ? `${sizes.slice(0, -1).join(", ")} and ${sizes[sizes.length - 1]}` : sizes[0]);

// Under the size pills: other sizes of this product that are already saved (each size is saved separately)
const SavedSizesHint = ({ product, selectedId }) => {
  const { data: wishlistIds } = useWishlistIds();
  const sizes = (product.variants || [])
    .filter((v) => v._id !== selectedId && wishlistIds?.has(wishlistKeyOf(product._id, v._id)))
    .map((v) => v.size || v.name);
  if (sizes.length === 0) return null;
  return (
    <p className="-mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-red-500" aria-live="polite">
      <Heart size={13} aria-hidden="true" className="fill-red-500" />
      {joinSizes(sizes)} {sizes.length === 1 ? "is" : "are"} in your wishlist
    </p>
  );
};

const ProductInfo = ({
  product,
  variant,
  titleId,
  quantity,
  maxQuantity,
  onQuantityChange,
  onSelectVariant,
  onAddToCart,
  onBuyNow,
  isPending,
  actionsRef,
}) => {
  const inStock = variant.stock > 0;
  const badges = getProductBadges({ ...product, price: variant.price });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-pink-100 bg-white px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#d6008a]">
            {CATEGORY_LABELS[product.category]}
          </span>
          {badges.map((label) => (
            <span
              key={label}
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${BADGE_STYLES[label]}`}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-start justify-between gap-3">
          <h1
            id={titleId}
            className="min-w-0 text-[26px] font-extrabold leading-tight tracking-tight text-[#1e1a3a] sm:text-[32px] xl:text-[36px]"
          >
            {productTitle(product.name, variant.name)}
          </h1>
          <WishlistButton
            productId={product._id}
            variantId={variant._id}
            name={productTitle(product.name, variant.name)}
            size={20}
            className="border border-pink-100 sm:mt-1"
          />
        </div>
        <RatingSummaryLink average={DUMMY_RATING_SUMMARY.average} total={DUMMY_RATING_SUMMARY.total} />
      </div>

      <div className="rounded-2xl border border-pink-100 bg-white p-5">
        <p className="text-[32px] font-extrabold leading-none text-[#1e1a3a]">
          <span className="sr-only">Price: </span>
          {formatPrice(variant.price)}
        </p>
        <p className="mt-2 text-[12.5px] text-slate-500">Inclusive of all taxes</p>
        <div className="mt-3">
          <StockStatus stock={variant.stock} />
        </div>
      </div>

      <VariantSelector variants={product.variants} selectedId={variant._id} onSelect={onSelectVariant} />
      <SavedSizesHint product={product} selectedId={variant._id} />

      {inStock && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-[13.5px] font-bold text-[#1e1a3a]">Quantity</span>
          <QuantityStepper value={quantity} max={maxQuantity} onChange={onQuantityChange} disabled={isPending} />
          {quantity > 1 && (
            <span className="text-[13px] font-semibold text-slate-500">
              Total <span className="text-[#1e1a3a]">{formatPrice(variant.price * quantity)}</span>
            </span>
          )}
        </div>
      )}

      <div ref={actionsRef}>
        <PurchaseButtons inStock={inStock} isPending={isPending} onAddToCart={onAddToCart} onBuyNow={onBuyNow} />
      </div>

      <ul className="grid grid-cols-2 gap-2.5">
        {TRUST_ITEMS.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white px-3 py-3 shadow-[0_4px_16px_-10px_rgba(59,42,138,0.15)]"
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#fff5fa] text-[#d6008a]">
              <Icon size={17} aria-hidden="true" />
            </span>
            <span className="text-[12px] font-bold leading-snug text-[#1e1a3a]">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductInfo;
