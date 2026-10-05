import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { AlertTriangle, ArrowRight, BarChart2, CalendarCheck, ChartNoAxesColumn, Loader2, PackageOpen, PieChart, RefreshCw, RotateCcw, Trophy } from "lucide-react";
import KpiCards from "../../../components/Admin/Dashboard/KpiCards";
import PanelCard from "../../../components/Admin/Dashboard/PanelCard";
import StatusBreakdown from "../../../components/Admin/Dashboard/StatusBreakdown";
import TopProducts from "../../../components/Admin/Dashboard/TopProducts";
import RecentOrders from "../../../components/Admin/Dashboard/RecentOrders";
import LowStockList from "../../../components/Admin/Dashboard/LowStockList";
import RevenueAreaChart from "../../../components/Admin/Charts/RevenueAreaChart";
import TimelineBarChart from "../../../components/Admin/Charts/TimelineBarChart";
import PaymentDonut from "../../../components/Admin/Charts/PaymentDonut";
import { ADMIN_CARD, ADMIN_SECONDARY_BUTTON } from "../../../components/Admin/Orders/adminOrderStyles";
import { useGetAdminDashboard } from "../../../hooks/Admin/ReportHooks";
import { useGetAdminOrderStats } from "../../../hooks/Admin/OrderHooks";
import { FRONTEND_ROUTES } from "../../../constants/frontendRoutes";
import { CHART_COLORS, formatMoney, formatRange } from "../../../utils/report";
import { usePageTitle } from "../../../hooks/common/usePageTitle";

const LINK_ACTION = "inline-flex items-center gap-1 text-[13px] font-bold text-indigo-600 hover:text-indigo-700";

// Placeholder inside a panel while loading, or when there is nothing to show
const PanelMessage = ({ icon: Icon, title, hint }) => (
  <div className="flex h-full min-h-[180px] flex-col items-center justify-center text-center">
    <Icon size={30} strokeWidth={1.6} aria-hidden="true" className="mb-2 text-slate-300" />
    <p className="text-[13.5px] font-bold text-slate-700">{title}</p>
    {hint && <p className="mt-0.5 text-[12px] text-slate-500">{hint}</p>}
  </div>
);

const PanelLoader = () => (
  <div className="flex h-full min-h-[180px] items-center justify-center">
    <Loader2 size={26} aria-label="Loading" className="animate-spin text-indigo-600" />
  </div>
);

// Work waiting on the admin (from the order stats the sidebar already loads)
const AttentionStrip = ({ stats }) => {
  const items = [
    { label: "Orders today", value: stats?.today, icon: CalendarCheck, tone: "bg-sky-50 text-sky-600", to: FRONTEND_ROUTES.ADMIN_ORDERS },
    {
      label: "Waiting to ship",
      value: stats ? stats.byStatus.confirmed + stats.byStatus.partially_cancelled : undefined,
      icon: PackageOpen,
      tone: "bg-amber-50 text-amber-600",
      to: FRONTEND_ROUTES.ADMIN_ORDERS,
    },
    { label: "Return requests", value: stats?.pendingReturns, icon: RotateCcw, tone: "bg-rose-50 text-rose-600", to: FRONTEND_ROUTES.ADMIN_RETURNS },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map(({ label, value, icon: Icon, tone, to }) => (
        <Link key={label} to={to} className={`${ADMIN_CARD} group flex items-center gap-3 px-4 py-3 hover:border-indigo-200 transition-colors`}>
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>
            <Icon size={17} aria-hidden="true" />
          </span>
          <span className="flex-1 text-[13px] font-semibold text-slate-600">{label}</span>
          {value === undefined ? (
            <span className="h-6 w-8 animate-pulse rounded bg-slate-100" />
          ) : (
            <span className="text-[20px] font-extrabold text-slate-800">{value}</span>
          )}
          <ArrowRight size={16} aria-hidden="true" className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
        </Link>
      ))}
    </div>
  );
};

const AdminDashboardPage = () => {
  usePageTitle("Admin · Dashboard");
  // The admin's own session (state.auth is the customer login, which may also be active in this browser)
  const user = useSelector((state) => state.adminSession?.user);
  const { data: response, isLoading, isError, isFetching, refetch } = useGetAdminDashboard();
  const { data: statsResponse } = useGetAdminOrderStats();
  const dashboard = response?.data;
  const hasSales = Boolean(dashboard?.summary.orders);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[26px] font-black tracking-tight text-slate-800">Dashboard</h1>
          <p className="mt-1 text-[14px] text-slate-500">
            Welcome back, <span className="font-semibold text-slate-700">{user?.firstName || "Admin"}</span>.{" "}
            {dashboard ? `Last 30 days · ${formatRange(dashboard.range)}` : "Here's how the store is doing."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => refetch()} disabled={isFetching} className={ADMIN_SECONDARY_BUTTON}>
            <RefreshCw size={16} aria-hidden="true" className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
          <Link
            to={FRONTEND_ROUTES.ADMIN_SALES_REPORTS}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-[14px] font-bold text-white hover:bg-indigo-700 transition-colors"
          >
            <BarChart2 size={16} aria-hidden="true" />
            Sales report
          </Link>
        </div>
      </div>

      {isError && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4">
          <p className="flex items-center gap-2 text-[14px] font-bold text-rose-600">
            <AlertTriangle size={18} aria-hidden="true" />
            Couldn't load the dashboard.
          </p>
          <button type="button" onClick={() => refetch()} disabled={isFetching} className="text-[13px] font-bold text-rose-600 hover:underline">
            {isFetching ? "Retrying…" : "Try again"}
          </button>
        </div>
      )}

      <div className="space-y-6">
        <AttentionStrip stats={statsResponse?.data} />

        <KpiCards kpis={dashboard?.kpis} isLoading={isLoading} />

        {/* Revenue trend + payment split */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <PanelCard
            className="lg:col-span-2"
            title="Revenue"
            subtitle={dashboard ? `Net revenue per day · ${formatMoney(dashboard.summary.net)} in total` : "Net revenue per day"}
            action={
              <Link to={FRONTEND_ROUTES.ADMIN_SALES_REPORTS} className={LINK_ACTION}>
                Details <ArrowRight size={14} aria-hidden="true" />
              </Link>
            }
          >
            <div className="h-72">
              {isLoading ? (
                <PanelLoader />
              ) : !dashboard ? null : hasSales ? (
                <RevenueAreaChart data={dashboard.timeline} />
              ) : (
                <PanelMessage icon={ChartNoAxesColumn} title="No delivered sales yet" hint="Revenue shows up here once orders are delivered." />
              )}
            </div>
          </PanelCard>

          <PanelCard title="Payment methods" subtitle="Orders placed, last 30 days">
            {isLoading ? (
              <PanelLoader />
            ) : !dashboard ? null : dashboard.byPaymentMethod.length ? (
              <PaymentDonut data={dashboard.byPaymentMethod} />
            ) : (
              <PanelMessage icon={PieChart} title="No orders yet" hint="Placed orders are split by payment method here." />
            )}
          </PanelCard>
        </div>

        {/* Orders per day + status breakdown */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <PanelCard
            className="lg:col-span-2"
            title="Orders placed"
            subtitle={dashboard ? `Per day · ${dashboard.kpis.ordersPlaced.value} in total` : "Per day"}
          >
            <div className="h-64">
              {isLoading ? (
                <PanelLoader />
              ) : !dashboard ? null : dashboard.kpis.ordersPlaced.value ? (
                <TimelineBarChart data={dashboard.timeline} series={[{ dataKey: "ordersPlaced", name: "Orders", color: CHART_COLORS.orders }]} />
              ) : (
                <PanelMessage icon={ChartNoAxesColumn} title="No orders in the last 30 days" />
              )}
            </div>
          </PanelCard>

          <PanelCard title="Order status" subtitle="All orders, by current status">
            {isLoading ? (
              <PanelLoader />
            ) : !dashboard ? null : dashboard.byStatus.length ? (
              <StatusBreakdown rows={dashboard.byStatus} />
            ) : (
              <PanelMessage icon={PackageOpen} title="No orders yet" />
            )}
          </PanelCard>
        </div>

        {/* Recent orders + top products / low stock */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <PanelCard
            className="lg:col-span-2"
            title="Recent orders"
            bodyClassName="p-0"
            action={
              <Link to={FRONTEND_ROUTES.ADMIN_ORDERS} className={LINK_ACTION}>
                View all <ArrowRight size={14} aria-hidden="true" />
              </Link>
            }
          >
            {isLoading ? (
              <PanelLoader />
            ) : !dashboard ? null : dashboard.recentOrders.length ? (
              <RecentOrders rows={dashboard.recentOrders} />
            ) : (
              <PanelMessage icon={PackageOpen} title="No orders yet" hint="New orders will show up here." />
            )}
          </PanelCard>

          <div className="flex flex-col gap-6">
            <PanelCard title="Top products" subtitle="Units delivered, last 30 days">
              {isLoading ? (
                <PanelLoader />
              ) : !dashboard ? null : dashboard.topProducts.length ? (
                <TopProducts rows={dashboard.topProducts} />
              ) : (
                <PanelMessage icon={Trophy} title="No sales yet" />
              )}
            </PanelCard>

            <PanelCard
              title="Low stock"
              subtitle={dashboard ? `${dashboard.lowStock.threshold} units or fewer` : undefined}
              action={
                <Link to={FRONTEND_ROUTES.ADMIN_PRODUCTS} className={LINK_ACTION}>
                  Products <ArrowRight size={14} aria-hidden="true" />
                </Link>
              }
            >
              {isLoading ? <PanelLoader /> : dashboard && <LowStockList variants={dashboard.lowStock.variants} threshold={dashboard.lowStock.threshold} />}
            </PanelCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
