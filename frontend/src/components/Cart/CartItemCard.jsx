import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Heart, Package, Trash2 } from "lucide-react";
import QuantityStepper from "../ProductDetail/QuantityStepper";
import { productDetailPath } from "../../constants/frontendRoutes";
import { FOCUS_RING } from "../../constants/customerTheme";
import { cloudinaryUrl } from "../../utils/cloudinary";
import { formatPrice, productTitle, LOW_STOCK_LIMIT } from "../../utils/product";

// Rapid stepper clicks show at once and go to the API as one update
const QUANTITY_DEBOUNCE_MS = 400;

const ISSUE_BANNERS = {
  out_of_stock: {
    className: "border-rose-100 bg-rose-50 text-rose-600",
    text: () => "Out of stock. Not included in your total.",
  },
  unavailable: {
    className: "border-slate-200 bg-slate-100 text-slate-600",
    text: () => "No longer available. Not included in your total.",
  },
  quantity_reduced: {
    className: "border-amber-100 bg-amber-50 text-amber-700",
    text: (item) => `Only ${item.stock} left, so we've updated your quantity.`,
  },
};

const TEXT_BUTTON = `inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold text-slate-500 hover:bg-[#fff5fa] hover:text-[#d6008a] transition-colors ${FOCUS_RING}`;

const percentOff = (price, mrp) => (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);

// Decorative (the title is the link people use); greyed out when the line can't be bought
const Thumb = ({ image, to, dimmed }) => {
  const className = `flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#fff5fa] to-[#f5effd] sm:h-28 sm:w-28 ${dimmed ? "opacity-50 grayscale" : ""}`;
  const content = image ? (
    <img
      src={cloudinaryUrl(image, 240)}
      alt=""
      width={112}
      height={112}
      loading="lazy"
      decoding="async"
      className="h-full w-full object-contain p-1.5 mix-blend-multiply"
    />
  ) : (
    <Package size={28} aria-hidden="true" className="text-pink-200" />
  );

  return to ? (
    <Link to={to} tabIndex={-1} aria-hidden="true" className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
};

/**
 * One cart line (from GET /user/cart). Out-of-stock lines are greyed out with only Move to Wishlist / Remove;
 * unavailable ones (deactivated or deleted products) only Remove.
 */
const CartItemCard = ({ item, onQuantityChange, onRemove, onMoveToWishlist }) => {
  const [draftQuantity, setDraftQuantity] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const name = productTitle(item.name, item.variantName) || "Unavailable product";
  const isGone = item.issue === "unavailable";
  const quantity = draftQuantity ?? item.quantity;
  const off = percentOff(item.price, item.mrp);
  const detailPath = isGone ? null : productDetailPath(item.productId, item.variantId);
  const meta = [item.size && `Size ${item.size}`, item.pieces && `${item.pieces} pcs`].filter(Boolean).join(" · ");
  const banner = ISSUE_BANNERS[item.issue];
  const isLowStock = !item.issue && item.stock <= LOW_STOCK_LIMIT;

  const handleQuantity = (next) => {
    setDraftQuantity(next);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (next !== item.quantity) onQuantityChange(item.itemId, next);
      setDraftQuantity(null);
    }, QUANTITY_DEBOUNCE_MS);
  };

  return (
    <article className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_4px_18px_-12px_rgba(59,42,138,0.18)] sm:gap-4 sm:p-4">
      <Thumb image={item.image} to={detailPath} dimmed={!item.isAvailable} />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug text-[#1e1a3a] sm:text-[15px]">
              {detailPath ? (
                <Link to={detailPath} className={`rounded hover:text-[#d6008a] transition-colors ${FOCUS_RING}`}>
                  {name}
                </Link>
              ) : (
                <span className="text-slate-400">{name}</span>
              )}
            </h3>
            {meta && <p className="mt-0.5 text-[12.5px] text-slate-500">{meta}</p>}
          </div>
          {item.isAvailable && (
            <p className="flex-shrink-0 text-[15px] font-extrabold text-[#1e1a3a] sm:text-[16px]">
              {formatPrice(item.price * quantity)}
            </p>
          )}
        </div>

        {item.price !== null && (
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[13px]">
            <span className={`font-bold ${item.isAvailable ? "text-[#1e1a3a]" : "text-slate-400"}`}>{formatPrice(item.price)}</span>
            {off > 0 && (
              <>
                <s className="text-slate-400">{formatPrice(item.mrp)}</s>
                <span className="font-bold text-emerald-600">{off}% off</span>
              </>
            )}
          </p>
        )}

        {isLowStock && <p className="text-[12px] font-semibold text-rose-500">Only {item.stock} left</p>}

        {banner && (
          <p className={`flex items-start gap-1.5 rounded-xl border px-3 py-2 text-[12.5px] font-semibold ${banner.className}`}>
            <AlertCircle size={15} aria-hidden="true" className="mt-px flex-shrink-0" />
            {banner.text(item)}
          </p>
        )}

        <div className={`mt-auto flex flex-wrap items-center gap-2 pt-1 ${item.isAvailable ? "justify-between" : "justify-end"}`}>
          {item.isAvailable && (
            <QuantityStepper value={quantity} max={item.maxQuantity} onChange={handleQuantity} label={`Quantity for ${name}`} />
          )}
          <div className="flex items-center">
            {!isGone && (
              <button type="button" onClick={() => onMoveToWishlist(item)} aria-label={`Move ${name} to wishlist`} className={TEXT_BUTTON}>
                <Heart size={15} aria-hidden="true" />
                <span className="sm:hidden">Save</span>
                <span className="hidden sm:inline">Move to Wishlist</span>
              </button>
            )}
            <button type="button" onClick={() => onRemove(item)} aria-label={`Remove ${name} from cart`} className={TEXT_BUTTON}>
              <Trash2 size={15} aria-hidden="true" />
              Remove
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default CartItemCard;
