// Full class strings per order status
const STATUS_STYLES = {
  Placed: "bg-amber-50 text-amber-700 border-amber-100",
  Shipped: "bg-sky-50 text-sky-700 border-sky-100",
  Delivered: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Cancelled: "bg-rose-50 text-rose-600 border-rose-100",
};

const OrderStatusPill = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11.5px] font-bold ${STATUS_STYLES[status] || "border-slate-200 bg-slate-50 text-slate-600"}`}
  >
    {status}
  </span>
);

export default OrderStatusPill;
