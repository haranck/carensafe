import {
  ITEM_STATUS_LABELS,
  ITEM_STATUS_STYLES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  PAYMENT_STATUS_STYLES,
  paymentStatusLabel,
} from "../../utils/order";

const PILL = "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11.5px] font-bold";
const FALLBACK = "border-slate-200 bg-slate-50 text-slate-600";

export const OrderStatusPill = ({ status }) => (
  <span className={`${PILL} ${ORDER_STATUS_STYLES[status] || FALLBACK}`}>{ORDER_STATUS_LABELS[status] || status}</span>
);

export const PaymentStatusPill = ({ order }) => (
  <span className={`${PILL} ${PAYMENT_STATUS_STYLES[order.paymentStatus] || FALLBACK}`}>{paymentStatusLabel(order)}</span>
);

// Nothing for an active item (the order's own status says enough)
export const ItemStatusPill = ({ status }) =>
  ITEM_STATUS_LABELS[status] ? <span className={`${PILL} ${ITEM_STATUS_STYLES[status]}`}>{ITEM_STATUS_LABELS[status]}</span> : null;
