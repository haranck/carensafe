import { Link } from "react-router-dom";
import { Info, Package, ShoppingBag } from "lucide-react";
import ProfileHeading from "../../components/Profile/ProfileHeading";
import PanelSkeleton from "../../components/Profile/PanelSkeleton";
import OrderCard from "../../components/Profile/OrderCard";
import SectionError from "../../components/Home/SectionError";
import { useGetMyOrders } from "../../hooks/Profile/ProfileHooks";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { FOCUS_RING, PINK_BUTTON } from "../../constants/customerTheme";

const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);

// TEMP: demo orders (useGetMyOrders) until the orders API exists
const ProfileOrdersPage = () => {
  const { data, isLoading, isError, isFetching, refetch } = useGetMyOrders();
  const orders = [...(data?.data || [])].sort(byNewest);

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
        <p className="text-[17px] font-extrabold text-[#1e1a3a]">No orders yet</p>
        <p className="text-[13.5px] text-slate-500">Your orders will show up here.</p>
        <Link
          to={FRONTEND_ROUTES.SHOP}
          className={`mt-3 inline-flex h-11 items-center gap-2 rounded-full px-6 text-[14px] font-bold ${PINK_BUTTON} ${FOCUS_RING}`}
        >
          <ShoppingBag size={16} aria-hidden="true" />
          Start Shopping
        </Link>
      </div>
    );
  } else {
    content = (
      <ul className="flex flex-col gap-4">
        {orders.map((order) => (
          <li key={order._id}>
            <OrderCard order={order} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      <ProfileHeading accent="Orders" description="Track and review your purchases." />
      <p className="mb-4 flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-2.5 text-[12.5px] font-semibold text-amber-700">
        <Info size={15} aria-hidden="true" className="flex-shrink-0" />
        Demo data: real orders will appear here once checkout is live.
      </p>
      {content}
    </>
  );
};

export default ProfileOrdersPage;
