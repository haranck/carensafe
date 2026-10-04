import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import OrderThumb from "./OrderThumb";
import { OrderStatusPill, PaymentStatusPill } from "./OrderPills";
import { orderDetailPath } from "../../constants/frontendRoutes";
import { FOCUS_RING } from "../../constants/customerTheme";
import { formatPrice } from "../../utils/product";
import { formatDate } from "../../utils/date";
import { unitsLabel } from "../../utils/order";

const MAX_THUMBNAILS = 4;

// One order in My Orders: number, date, status + payment, thumbnails, total and a link to the detail page
const OrderCard = ({ order }) => {
  const extra = order.items.length - MAX_THUMBNAILS;

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_4px_18px_-12px_rgba(59,42,138,0.18)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-all text-[14.5px] font-extrabold text-[#1e1a3a]">Order #{order.orderNumber}</p>
          <p className="text-[12.5px] text-slate-500">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <OrderStatusPill status={order.orderStatus} />
          <PaymentStatusPill order={order} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex items-center gap-2" aria-label="Items">
          {order.items.slice(0, MAX_THUMBNAILS).map((item) => (
            <li key={item._id}>
              <OrderThumb image={item.image} />
            </li>
          ))}
          {extra > 0 && (
            <li className="flex h-14 items-center justify-center rounded-xl bg-slate-50 px-3 text-[12.5px] font-bold text-slate-500">
              +{extra} more
            </li>
          )}
        </ul>
        <div className="text-right">
          <p className="text-[12px] text-slate-500">{unitsLabel(order.items)}</p>
          <p className="text-[17px] font-extrabold text-[#1e1a3a]">{formatPrice(order.pricing.total)}</p>
        </div>
      </div>

      <Link
        to={orderDetailPath(order._id)}
        className={`mt-3 -ml-3 inline-flex h-10 items-center gap-1 rounded-full px-3 text-[13px] font-bold text-[#d6008a] hover:bg-[#fff5fa] hover:text-[#9d0063] transition-colors ${FOCUS_RING}`}
      >
        View details
        <ChevronRight size={16} aria-hidden="true" />
      </Link>
    </article>
  );
};

export default OrderCard;
