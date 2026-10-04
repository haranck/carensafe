import { CalendarCheck, PackageCheck, PackageOpen, RotateCcw, ShoppingBag, Truck } from "lucide-react";
import { ADMIN_CARD } from "./adminOrderStyles";

// Full class strings per card (no dynamic Tailwind names)
const CARDS = [
  { key: "total", label: "Total orders", icon: ShoppingBag, tone: "bg-indigo-50 text-indigo-600", value: (s) => s.total },
  { key: "today", label: "Today", icon: CalendarCheck, tone: "bg-sky-50 text-sky-600", value: (s) => s.today },
  {
    key: "toShip",
    label: "To ship",
    icon: PackageOpen,
    tone: "bg-amber-50 text-amber-600",
    value: (s) => s.byStatus.confirmed + s.byStatus.partially_cancelled,
  },
  { key: "inTransit", label: "In transit", icon: Truck, tone: "bg-violet-50 text-violet-600", value: (s) => s.byStatus.shipped + s.byStatus.out_for_delivery },
  { key: "delivered", label: "Delivered", icon: PackageCheck, tone: "bg-emerald-50 text-emerald-600", value: (s) => s.byStatus.delivered },
  { key: "returns", label: "Pending returns", icon: RotateCcw, tone: "bg-rose-50 text-rose-600", value: (s) => s.pendingReturns },
];

const OrderStatCards = ({ stats, isLoading }) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
    {CARDS.map(({ key, label, icon: Icon, tone, value }) => (
      <div key={key} className={`${ADMIN_CARD} p-4`}>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
          <Icon size={18} aria-hidden="true" />
        </span>
        {isLoading || !stats ? (
          <span className="mt-3 block h-7 w-12 animate-pulse rounded bg-slate-100" />
        ) : (
          <p className="mt-3 text-[24px] font-extrabold leading-none text-slate-800">{value(stats)}</p>
        )}
        <p className="mt-1.5 text-[12px] font-semibold text-slate-500">{label}</p>
      </div>
    ))}
  </div>
);

export default OrderStatCards;
