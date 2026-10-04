import { useId, useState } from "react";
import { ChevronDown, Package } from "lucide-react";
import OrderStatusPill from "./OrderStatusPill";
import { FOCUS_RING } from "../../constants/customerTheme";
import { formatPrice } from "../../utils/product";
import { formatDate } from "../../utils/date";

const MAX_THUMBNAILS = 4;

export const OrderThumb = ({ image, className = "h-14 w-14" }) => (
  <span className={`flex flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#fff5fa] to-[#f5effd] ${className}`}>
    {image ? (
      <img src={image} alt="" width={56} height={56} loading="lazy" className="h-full w-full object-cover" />
    ) : (
      <Package size={20} aria-hidden="true" className="text-pink-200" />
    )}
  </span>
);

const unitsLabel = (items) => {
  const units = items.reduce((total, item) => total + item.quantity, 0);
  return `${units} ${units === 1 ? "item" : "items"}`;
};

// One order: id, date, status, thumbnails and total; "View details" expands the items inline
const OrderCard = ({ order }) => {
  const [isOpen, setIsOpen] = useState(false);
  const detailsId = useId();
  const extra = order.items.length - MAX_THUMBNAILS;

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_4px_18px_-12px_rgba(59,42,138,0.18)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[14.5px] font-extrabold text-[#1e1a3a]">Order #{order._id}</p>
          <p className="text-[12.5px] text-slate-500">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusPill status={order.status} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex items-center gap-2" aria-label="Items">
          {order.items.slice(0, MAX_THUMBNAILS).map((item, i) => (
            <li key={`${item.name}-${i}`}>
              <OrderThumb image={item.image} />
            </li>
          ))}
          {extra > 0 && (
            <li className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50 text-[12.5px] font-bold text-slate-500">
              +{extra}
            </li>
          )}
        </ul>
        <div className="text-right">
          <p className="text-[12px] text-slate-500">{unitsLabel(order.items)}</p>
          <p className="text-[17px] font-extrabold text-[#1e1a3a]">{formatPrice(order.total)}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={detailsId}
        className={`mt-3 inline-flex h-10 items-center gap-1.5 rounded-full px-3 -ml-3 text-[13px] font-bold text-[#d6008a] hover:bg-[#fff5fa] hover:text-[#9d0063] transition-colors ${FOCUS_RING}`}
      >
        {isOpen ? "Hide details" : "View details"}
        <ChevronDown size={16} aria-hidden="true" className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div id={detailsId} className="mt-2 border-t border-slate-100 pt-3">
          <ul className="flex flex-col gap-3">
            {order.items.map((item, i) => (
              <li key={`${item.name}-${i}`} className="flex items-center gap-3">
                <OrderThumb image={item.image} className="h-12 w-12" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[13.5px] font-semibold text-[#1e1a3a]">{item.name}</p>
                  <p className="text-[12px] text-slate-500">
                    Size {item.size} · Qty {item.quantity} × {formatPrice(item.price)}
                  </p>
                </div>
                <p className="flex-shrink-0 text-[13.5px] font-bold text-[#1e1a3a]">{formatPrice(item.price * item.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 flex flex-col gap-1.5 rounded-xl bg-slate-50 px-4 py-3 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Payment</dt>
              <dd className="font-semibold text-[#1e1a3a]">{order.paymentMethod}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Total</dt>
              <dd className="font-extrabold text-[#1e1a3a]">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </div>
      )}
    </article>
  );
};

export default OrderCard;
