// Order labels and pill colours (full Tailwind class strings, never built dynamically)

export const ORDER_STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  partially_cancelled: "Partially cancelled",
  return_requested: "Return requested",
  returned: "Returned",
  partially_returned: "Partially returned",
  pending_payment: "Payment pending",
  payment_failed: "Payment failed",
  payment_expired: "Payment expired",
};

export const ORDER_STATUS_STYLES = {
  pending: "border-slate-200 bg-slate-50 text-slate-600",
  confirmed: "border-sky-100 bg-sky-50 text-sky-700",
  shipped: "border-indigo-100 bg-indigo-50 text-indigo-700",
  out_for_delivery: "border-violet-100 bg-violet-50 text-violet-700",
  delivered: "border-emerald-100 bg-emerald-50 text-emerald-700",
  cancelled: "border-rose-100 bg-rose-50 text-rose-600",
  partially_cancelled: "border-rose-100 bg-rose-50 text-rose-600",
  return_requested: "border-amber-100 bg-amber-50 text-amber-700",
  returned: "border-slate-200 bg-slate-100 text-slate-700",
  partially_returned: "border-slate-200 bg-slate-100 text-slate-700",
  pending_payment: "border-amber-100 bg-amber-50 text-amber-700",
  payment_failed: "border-rose-100 bg-rose-50 text-rose-600",
  payment_expired: "border-rose-100 bg-rose-50 text-rose-600",
};

// Orders closed before they were paid (no stock reserved, nothing charged / wallet part returned)
export const UNPAID_CLOSED_STATUSES = ["payment_failed", "payment_expired"];

export const ITEM_STATUS_LABELS = {
  active: "",
  cancelled: "Cancelled",
  return_requested: "Return requested",
  return_approved: "Return approved",
  return_rejected: "Return rejected",
  returned: "Returned",
};

export const ITEM_STATUS_STYLES = {
  cancelled: "border-rose-100 bg-rose-50 text-rose-600",
  return_requested: "border-amber-100 bg-amber-50 text-amber-700",
  return_approved: "border-emerald-100 bg-emerald-50 text-emerald-700",
  return_rejected: "border-rose-100 bg-rose-50 text-rose-600",
  returned: "border-slate-200 bg-slate-100 text-slate-700",
};

export const PAYMENT_STATUS_STYLES = {
  pending: "border-amber-100 bg-amber-50 text-amber-700",
  paid: "border-emerald-100 bg-emerald-50 text-emerald-700",
  failed: "border-rose-100 bg-rose-50 text-rose-600",
  refunded: "border-slate-200 bg-slate-100 text-slate-700",
  partially_refunded: "border-slate-200 bg-slate-100 text-slate-700",
};

export const PAYMENT_STATUS_LABELS = {
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
};

export const PAYMENT_METHOD_LABELS = { cod: "Cash on Delivery", razorpay: "Online (Razorpay)", wallet: "Care N Safe Wallet" };

// COD stays "pending" until delivery ("Pay on delivery"); an unpaid online order is "Awaiting payment"
export const paymentStatusLabel = (order) => {
  if (order.paymentStatus === "pending") return order.paymentMethod === "cod" ? "Pay on delivery" : "Awaiting payment";
  return PAYMENT_STATUS_LABELS[order.paymentStatus] || "";
};

// "Wallet ₹100 + Online ₹350" for split payments, else the method name
export const paymentMethodSummary = (order, formatPaise) => {
  const walletPaise = order.payment?.walletPaise || 0;
  const onlinePaise = order.payment?.onlinePaise || 0;
  if (order.paymentMethod === "razorpay" && walletPaise > 0) return `Wallet ${formatPaise(walletPaise)} + Online ${formatPaise(onlinePaise)}`;
  return PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod;
};

// Same values as config/orders.js CANCEL_REASONS (backend)
export const CANCEL_REASONS = [
  { value: "size_mismatch", label: "Size mismatch" },
  { value: "ordered_by_mistake", label: "Ordered by mistake" },
  { value: "found_better_price", label: "Found a better price" },
  { value: "delivery_too_late", label: "Delivery is taking too long" },
  { value: "other", label: "Other" },
];
// Reasons only the system sets
const SYSTEM_CANCEL_REASONS = {
  payment_not_completed: "Payment not completed",
  out_of_stock_after_payment: "Out of stock after payment",
};
export const cancelReasonLabel = (value) =>
  CANCEL_REASONS.find((reason) => reason.value === value)?.label || SYSTEM_CANCEL_REASONS[value] || value;

// My Orders filter pills (config/orders.js STATUS_GROUPS)
export const ORDER_FILTERS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returns", label: "Returns" },
];

// Tracking stepper: the happy path, in order
export const TRACKING_STEPS = ["confirmed", "shipped", "out_for_delivery", "delivered"];

// History entries also use item-level events (return_approved / return_rejected)
const EVENT_LABELS = { refunded: "Refunded to wallet" };
export const historyLabel = (status) =>
  ORDER_STATUS_LABELS[status] || ITEM_STATUS_LABELS[status] || EVENT_LABELS[status] || status.replace(/_/g, " ");

const DATE_TIME = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
const SHORT_DATE = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

// "4 Oct 2026, 3:05 pm"
export const formatDateTime = (value) => (value ? DATE_TIME.format(new Date(value)) : "");
// "4 Oct"
export const formatShortDate = (value) => (value ? SHORT_DATE.format(new Date(value)) : "");

const DAY_MS = 24 * 60 * 60 * 1000;
// Whole days left until `endsAt` (0 on the last day, null when there's no window)
export const daysLeft = (endsAt) => (endsAt ? Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / DAY_MS)) : null);

// Whether a date has passed (return window closed)
export const isPast = (value) => Boolean(value) && new Date(value).getTime() < Date.now();

export const unitsLabel = (items) => {
  const units = items.reduce((total, item) => total + item.quantity, 0);
  return `${units} ${units === 1 ? "item" : "items"}`;
};
