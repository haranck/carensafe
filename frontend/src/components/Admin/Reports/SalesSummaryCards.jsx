import { BadgePercent, IndianRupee, PackageCheck, ReceiptText, RotateCcw, Wallet } from "lucide-react";
import { ADMIN_CARD } from "../Orders/adminOrderStyles";
import { formatMoney } from "../../../utils/report";

const units = (count) => `${count} ${count === 1 ? "unit" : "units"}`;

// Full class strings per card (no dynamic Tailwind names)
const CARDS = [
  { key: "net", label: "Net revenue", hint: () => "Gross sales − returns", icon: IndianRupee, tone: "bg-indigo-50 text-indigo-600", money: true },
  { key: "gross", label: "Gross sales", hint: (s) => `Incl. ${formatMoney(s.shipping)} shipping`, icon: Wallet, tone: "bg-sky-50 text-sky-600", money: true },
  { key: "orders", label: "Orders", hint: (s) => `${units(s.units)} kept`, icon: PackageCheck, tone: "bg-emerald-50 text-emerald-600" },
  { key: "returnedAmount", label: "Returned", hint: (s) => `${units(s.unitsReturned)} came back`, icon: RotateCcw, tone: "bg-orange-50 text-orange-600", money: true },
  { key: "discount", label: "Discounts", hint: () => "Given on these orders", icon: BadgePercent, tone: "bg-rose-50 text-rose-600", money: true },
  { key: "avgOrderValue", label: "Avg. order value", hint: () => "Net revenue ÷ orders", icon: ReceiptText, tone: "bg-violet-50 text-violet-600", money: true },
];

const SalesSummaryCards = ({ summary, isLoading }) => (
  <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
    {CARDS.map(({ key, label, hint, icon: Icon, tone, money }) => (
      <div key={key} className={`${ADMIN_CARD} min-w-0 p-4 sm:p-5`}>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
          <Icon size={18} aria-hidden="true" />
        </span>
        {isLoading || !summary ? (
          <span className="mt-4 block h-7 w-24 animate-pulse rounded bg-slate-100" />
        ) : (
          <p className="mt-4 truncate text-[19px] sm:text-[24px] font-extrabold leading-none text-slate-800">
            {money ? formatMoney(summary[key]) : summary[key].toLocaleString("en-IN")}
          </p>
        )}
        <p className="mt-2 text-[13px] font-semibold text-slate-600">{label}</p>
        <p className="text-[11.5px] text-slate-400">{summary ? hint(summary) : " "}</p>
      </div>
    ))}
  </div>
);

export default SalesSummaryCards;
