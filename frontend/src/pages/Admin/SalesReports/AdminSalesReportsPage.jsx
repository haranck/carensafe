import { useState } from "react";
import toast from "react-hot-toast";
import { ChartNoAxesColumn, FileDown, Loader2, Trophy } from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import PanelCard from "../../../components/Admin/Dashboard/PanelCard";
import TopProducts from "../../../components/Admin/Dashboard/TopProducts";
import TimelineBarChart from "../../../components/Admin/Charts/TimelineBarChart";
import PeriodFilter from "../../../components/Admin/Reports/PeriodFilter";
import SalesSummaryCards from "../../../components/Admin/Reports/SalesSummaryCards";
import SalesTable from "../../../components/Admin/Reports/SalesTable";
import { ADMIN_CARD, ADMIN_PRIMARY_BUTTON } from "../../../components/Admin/Orders/adminOrderStyles";
import { useExportSalesReport, useGetSalesReport } from "../../../hooks/Admin/ReportHooks";
import { CHART_COLORS, formatCompactPrice, formatMoney, formatRange, periodHint, swatchClass } from "../../../utils/report";
import { usePageTitle } from "../../../hooks/common/usePageTitle";

const PAGE_SIZE = 10;

// Revenue: net + returned stacked (= gross per bucket); Orders: delivered orders per bucket
const CHART_VIEWS = {
  revenue: {
    label: "Revenue",
    series: [
      { dataKey: "net", name: "Net revenue", color: CHART_COLORS.net },
      { dataKey: "returnedAmount", name: "Returned", color: CHART_COLORS.returned },
    ],
    formatValue: (value) => formatMoney(value),
    formatAxis: formatCompactPrice,
  },
  orders: {
    label: "Orders",
    series: [{ dataKey: "orders", name: "Delivered orders", color: CHART_COLORS.orders }],
    formatValue: (value) => value,
  },
};

const UNIT_LABELS = { hour: "per hour", day: "per day", month: "per month" };

const AdminSalesReportsPage = () => {
  usePageTitle("Admin · Sales Report");
  const [period, setPeriod] = useState({ period: "monthly", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [chartView, setChartView] = useState("revenue");

  const filters = { ...period, page, limit: PAGE_SIZE };
  const { data: response, isLoading, isError, isFetching, refetch } = useGetSalesReport(filters);
  const { mutate: exportReport, isPending: isExporting } = useExportSalesReport();

  const report = response?.data;
  const rows = report?.orders || [];
  const pagination = response?.pagination || { total: 0, totalPages: 1 };
  const hasSales = Boolean(report?.summary.orders);
  const view = CHART_VIEWS[chartView];

  const changePeriod = (next) => {
    setPeriod(next);
    setPage(1);
  };

  const downloadPdf = () => {
    exportReport(period, {
      onSuccess: async (result) => {
        try {
          const { downloadSalesReportPdf } = await import("../../../components/Admin/Reports/salesReportPdf");
          await downloadSalesReportPdf(result.data);
          toast.success(result.data.truncated ? "PDF downloaded (first 5,000 orders only)." : "Sales report downloaded.");
        } catch {
          toast.error("Couldn't create the PDF. Please try again.");
        }
      },
      onError: (error) => toast.error(error?.response?.data?.message || "Couldn't export the sales report."),
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Sales Report</h1>
          <p className="mt-1 text-[14px] text-slate-500">
            Delivered and partially returned orders, dated by delivery.
            {report && <span className="font-semibold text-slate-700"> {formatRange(report.range)}</span>}
          </p>
        </div>
        <button type="button" onClick={downloadPdf} disabled={isExporting || isLoading || isError} className={ADMIN_PRIMARY_BUTTON}>
          {isExporting ? <Loader2 size={16} aria-hidden="true" className="animate-spin" /> : <FileDown size={16} aria-hidden="true" />}
          {isExporting ? "Preparing PDF…" : "Download PDF"}
        </button>
      </div>

      <div className={`${ADMIN_CARD} mb-6 p-4`}>
        <PeriodFilter value={period} onChange={changePeriod} />
      </div>

      <div className="space-y-6">
        <SalesSummaryCards summary={report?.summary} isLoading={isLoading} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <PanelCard
            className="lg:col-span-2"
            title="Sales trend"
            subtitle={report ? `${view.label} ${UNIT_LABELS[report.range.unit]} · ${report.range.period === "custom" ? "Custom range" : periodHint(report.range.period)}` : undefined}
            action={
              <div role="tablist" aria-label="Chart metric" className="flex gap-1 rounded-lg bg-slate-100 p-1">
                {Object.entries(CHART_VIEWS).map(([key, option]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={chartView === key}
                    onClick={() => setChartView(key)}
                    className={`h-8 rounded-md px-3 text-[12.5px] font-bold transition-colors ${
                      chartView === key ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            }
          >
            {view.series.length > 1 && hasSales && (
              <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px]">
                {view.series.map((series) => (
                  <li key={series.dataKey} className="flex items-center gap-2 font-semibold text-slate-600">
                    <span className={`h-2.5 w-2.5 rounded-sm ${swatchClass(series.color)}`} aria-hidden="true" />
                    {series.name}
                    <span className="font-bold text-slate-800">{formatMoney(report.summary[series.dataKey])}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="h-72">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 size={26} aria-label="Loading chart" className="animate-spin text-indigo-600" />
                </div>
              ) : isError || !report ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="font-bold text-rose-500">Failed to load the sales report.</p>
                  <button type="button" onClick={() => refetch()} disabled={isFetching} className="mt-2 text-[13px] font-bold text-indigo-600 hover:underline">
                    {isFetching ? "Retrying…" : "Try again"}
                  </button>
                </div>
              ) : hasSales ? (
                <TimelineBarChart data={report.timeline} series={view.series} formatValue={view.formatValue} formatAxis={view.formatAxis} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <ChartNoAxesColumn size={30} strokeWidth={1.6} aria-hidden="true" className="mb-2 text-slate-300" />
                  <p className="text-[13.5px] font-bold text-slate-700">No sales in this period</p>
                  <p className="text-[12px] text-slate-500">Try weekly, monthly or yearly.</p>
                </div>
              )}
            </div>
          </PanelCard>

          <PanelCard title="Top products" subtitle="By units kept in this period">
            {isLoading ? (
              <div className="flex min-h-[180px] items-center justify-center">
                <Loader2 size={26} aria-label="Loading" className="animate-spin text-indigo-600" />
              </div>
            ) : report?.topProducts.length ? (
              <TopProducts rows={report.topProducts} />
            ) : (
              <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
                <Trophy size={30} strokeWidth={1.6} aria-hidden="true" className="mb-2 text-slate-300" />
                <p className="text-[13.5px] font-bold text-slate-700">No sales yet</p>
              </div>
            )}
          </PanelCard>
        </div>

        <PanelCard title="Orders" subtitle={report ? `${pagination.total} in this period` : undefined} bodyClassName="p-0">
          <SalesTable rows={rows} isLoading={isLoading} isError={isError} isFetching={isFetching} onRetry={() => refetch()} />
          {pagination.totalPages > 1 && (
            <div className="border-t border-slate-100 px-3 pb-4">
              <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} totalItems={pagination.total} itemsPerPage={PAGE_SIZE} />
            </div>
          )}
        </PanelCard>
      </div>
    </div>
  );
};

export default AdminSalesReportsPage;
