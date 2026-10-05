import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Package, ShoppingBag } from "lucide-react";
import ProfileHeading from "../../components/Profile/ProfileHeading";
import PanelSkeleton from "../../components/Profile/PanelSkeleton";
import OrderCard from "../../components/Order/OrderCard";
import SectionError from "../../components/Home/SectionError";
import { useGetMyOrders } from "../../hooks/Order/OrderHooks";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { FOCUS_RING, PINK_BUTTON } from "../../constants/customerTheme";
import { ORDER_FILTERS } from "../../utils/order";
import { usePageTitle } from "../../hooks/common/usePageTitle";

const PAGE_SIZE = 5;
const PAGER_BUTTON = `inline-flex h-10 items-center gap-1 rounded-full border border-slate-200 bg-white px-4 text-[13px] font-bold text-slate-600 hover:border-pink-200 hover:text-[#d6008a] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING}`;

const EMPTY_HINTS = {
  "": "Your orders will show up here.",
  active: "No orders on their way right now.",
  delivered: "No delivered orders yet.",
  cancelled: "No cancelled orders.",
  returns: "No returns.",
};

const ProfileOrdersPage = () => {
  usePageTitle("My Orders");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, isFetching, isPlaceholderData, refetch } = useGetMyOrders({ page, limit: PAGE_SIZE, status });
  const orders = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const chooseFilter = (value) => {
    setStatus(value);
    setPage(1);
  };

  let content;
  if (isLoading) {
    content = (
      <div className="flex flex-col gap-4">
        <PanelSkeleton lines={3} />
        <PanelSkeleton lines={3} />
      </div>
    );
  } else if (isError) {
    content = <SectionError message="We couldn't load your orders." onRetry={refetch} isRetrying={isFetching} />;
  } else if (orders.length === 0) {
    content = (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-pink-200 bg-white px-6 py-14 text-center">
        <span className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-[#fff5fa]">
          <Package size={38} strokeWidth={1.6} aria-hidden="true" className="text-pink-300" />
        </span>
        <p className="text-[17px] font-extrabold text-[#1e1a3a]">No orders here</p>
        <p className="text-[13.5px] text-slate-500">{EMPTY_HINTS[status]}</p>
        {!status && (
          <Link
            to={FRONTEND_ROUTES.SHOP}
            className={`mt-3 inline-flex h-11 items-center gap-2 rounded-full px-6 text-[14px] font-bold ${PINK_BUTTON} ${FOCUS_RING}`}
          >
            <ShoppingBag size={16} aria-hidden="true" />
            Start Shopping
          </Link>
        )}
      </div>
    );
  } else {
    content = (
      <>
        <ul className={`flex flex-col gap-4 transition-opacity ${isPlaceholderData ? "opacity-60" : "opacity-100"}`} aria-busy={isPlaceholderData}>
          {orders.map((order) => (
            <li key={order._id}>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
        {totalPages > 1 && (
          <nav aria-label="Order pages" className="mt-5 flex items-center justify-between gap-3">
            <button type="button" onClick={() => setPage((p) => p - 1)} disabled={page <= 1} className={PAGER_BUTTON}>
              <ChevronLeft size={16} aria-hidden="true" />
              Previous
            </button>
            <span className="text-[13px] font-semibold text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages} className={PAGER_BUTTON}>
              Next
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </nav>
        )}
      </>
    );
  }

  return (
    <>
      <ProfileHeading accent="Orders" description="Track and review your purchases." />
      <div role="group" aria-label="Filter orders" className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {ORDER_FILTERS.map((filter) => {
          const isActive = status === filter.value;
          return (
            <button
              key={filter.label}
              type="button"
              onClick={() => chooseFilter(filter.value)}
              aria-pressed={isActive}
              className={`inline-flex h-10 flex-shrink-0 items-center rounded-full border px-4 text-[13px] font-bold transition-colors ${FOCUS_RING} ${
                isActive ? "border-[#d6008a] bg-[#d6008a] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-pink-200 hover:text-[#d6008a]"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
      {content}
    </>
  );
};

export default ProfileOrdersPage;
