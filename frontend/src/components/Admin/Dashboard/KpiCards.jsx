import { Boxes, IndianRupee, PackageCheck, ReceiptText, ShoppingCart, TrendingDown, TrendingUp, UserPlus } from "lucide-react";
import { ADMIN_CARD } from "../Orders/adminOrderStyles";
import { formatChange, formatMoney } from "../../../utils/report";

// Full class strings per card (no dynamic Tailwind names)
const CARDS = [
  { key: "netRevenue", label: "Net revenue", hint: "Delivered, after returns", icon: IndianRupee, tone: "bg-indigo-50 text-indigo-600", money: true },
  { key: "salesOrders", label: "Delivered orders", hint: "Counted as sales", icon: PackageCheck, tone: "bg-emerald-50 text-emerald-600" },
  { key: "avgOrderValue", label: "Avg. order value", hint: "Net revenue ÷ orders", icon: ReceiptText, tone: "bg-violet-50 text-violet-600", money: true },
  { key: "ordersPlaced", label: "Orders placed", hint: "Any status", icon: ShoppingCart, tone: "bg-sky-50 text-sky-600" },
  { key: "unitsSold", label: "Units sold", hint: "Delivered, kept", icon: Boxes, tone: "bg-amber-50 text-amber-600" },
  { key: "newCustomers", label: "New customers", hint: "Sign-ups", icon: UserPlus, tone: "bg-rose-50 text-rose-600" },
];

const ChangePill = ({ change }) => {
  const text = formatChange(change);
  if (!text) return <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-400">New</span>;
  const up = change >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${up ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
      title="Compared with the 30 days before"
    >
      <Icon size={12} aria-hidden="true" />
      {text}
    </span>
  );
};

// kpis: { [key]: { value, change } }
const KpiCards = ({ kpis, isLoading }) => (
  <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
    {CARDS.map(({ key, label, hint, icon: Icon, tone, money }) => (
      <div key={key} className={`${ADMIN_CARD} min-w-0 p-4 sm:p-5`}>
        <div className="flex items-center justify-between gap-2">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
            <Icon size={18} aria-hidden="true" />
          </span>
          {!isLoading && kpis && <ChangePill change={kpis[key].change} />}
        </div>
        {isLoading || !kpis ? (
          <span className="mt-4 block h-7 w-24 animate-pulse rounded bg-slate-100" />
        ) : (
          <p className="mt-4 truncate text-[19px] sm:text-[24px] font-extrabold leading-none text-slate-800">
            {money ? formatMoney(kpis[key].value) : kpis[key].value.toLocaleString("en-IN")}
          </p>
        )}
        <p className="mt-2 text-[13px] font-semibold text-slate-600">{label}</p>
        <p className="text-[11.5px] text-slate-400">{hint}</p>
      </div>
    ))}
  </div>
);

export default KpiCards;
