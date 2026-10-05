import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, ChevronRight, Heart, Mail, MapPin, Package, Phone, Plus, ShoppingBag, Store, Wallet } from "lucide-react";
import UserAvatar from "../../components/common/UserAvatar";
import Panel from "../../components/Profile/Panel";
import PanelSkeleton from "../../components/Profile/PanelSkeleton";
import AddressCard from "../../components/Profile/AddressCard";
import OrderThumb from "../../components/Order/OrderThumb";
import { OrderStatusPill } from "../../components/Order/OrderPills";
import SectionError from "../../components/Home/SectionError";
import { INFO_LINKS } from "../../components/Layout/HeaderParts/navConfig";
import { useGetProfile } from "../../hooks/Profile/ProfileHooks";
import { useGetMyOrders } from "../../hooks/Order/OrderHooks";
import { useGetAddresses } from "../../hooks/Address/AddressHooks";
import { useWishlistIds } from "../../hooks/Wishlist/WishlistHooks";
import { useCartCount } from "../../hooks/Cart/CartHooks";
import { useWalletBalance } from "../../hooks/Wallet/WalletHooks";
import { FRONTEND_ROUTES, orderDetailPath } from "../../constants/frontendRoutes";
import { BRAND_GRADIENT, FOCUS_RING } from "../../constants/customerTheme";
import { formatPrice } from "../../utils/product";
import { formatDate, formatMonthYear } from "../../utils/date";
import { formatPaise } from "../../utils/wallet";
import { usePageTitle } from "../../hooks/common/usePageTitle";

const PANEL_LINK = `inline-flex min-h-10 items-center gap-1 rounded-full px-2 text-[13px] font-bold text-[#d6008a] hover:text-[#9d0063] ${FOCUS_RING}`;

const QUICK_LINKS = [
  { label: "Shop", icon: Store, to: FRONTEND_ROUTES.SHOP },
  { label: "Wishlist", icon: Heart, to: FRONTEND_ROUTES.WISHLIST },
  { label: "Cart", icon: ShoppingBag, to: FRONTEND_ROUTES.CART },
];

const StatTile = ({ icon: Icon, label, value, to }) => (
  <Link
    to={to}
    className={`flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_4px_18px_-12px_rgba(59,42,138,0.18)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(59,42,138,0.10)] transition-all duration-200 ${FOCUS_RING}`}
  >
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff5fa] text-[#d6008a]">
      <Icon size={19} aria-hidden="true" />
    </span>
    <span className="text-[22px] font-extrabold leading-none text-[#1e1a3a]">{value}</span>
    <span className="text-[12.5px] font-semibold text-slate-500">{label}</span>
  </Link>
);

const WelcomeCard = ({ profile }) => (
  <section className={`relative overflow-hidden rounded-3xl p-5 text-white sm:p-7 ${BRAND_GRADIENT}`}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
      <UserAvatar user={profile} className="h-20 w-20 text-[26px] ring-4 ring-white/30" />
      <div className="min-w-0">
        <h1 className="text-[24px] font-extrabold leading-tight sm:text-[28px]">Hello, {profile.firstName}</h1>
        <ul className="mt-2 flex flex-col gap-1 text-[13px] text-white/85">
          <li className="flex min-w-0 items-center gap-2">
            <Mail size={14} aria-hidden="true" className="flex-shrink-0" />
            <span className="truncate">{profile.email}</span>
          </li>
          <li className="flex items-center gap-2">
            <Phone size={14} aria-hidden="true" className="flex-shrink-0" />
            {profile.phone ? (
              profile.phone
            ) : (
              <Link to={FRONTEND_ROUTES.PROFILE_EDIT} className="rounded font-semibold text-white underline underline-offset-2 hover:text-pink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
                Add phone number
              </Link>
            )}
          </li>
          <li className="flex items-center gap-2">
            <CalendarDays size={14} aria-hidden="true" className="flex-shrink-0" />
            Member since {formatMonthYear(profile.createdAt)}
          </li>
        </ul>
      </div>
    </div>
  </section>
);

const LatestOrder = ({ order }) => {
  if (!order) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-[13.5px] text-slate-500">You haven&apos;t placed an order yet.</p>
        <Link to={FRONTEND_ROUTES.SHOP} className={PANEL_LINK}>
          Start shopping <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    );
  }

  const [first, ...rest] = order.items;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link to={orderDetailPath(order._id)} className={`break-all rounded text-[14px] font-extrabold text-[#1e1a3a] hover:text-[#d6008a] ${FOCUS_RING}`}>
            Order #{order.orderNumber}
          </Link>
          <p className="text-[12.5px] text-slate-500">{formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusPill status={order.orderStatus} />
      </div>
      <div className="flex items-center gap-3">
        <OrderThumb image={first.image} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[13.5px] font-semibold text-[#1e1a3a]">{first.name}</p>
          {rest.length > 0 && <p className="text-[12.5px] font-semibold text-slate-500">+{rest.length} more</p>}
        </div>
        <p className="flex-shrink-0 text-[16px] font-extrabold text-[#1e1a3a]">{formatPrice(order.pricing.total)}</p>
      </div>
    </div>
  );
};

const ProfileDashboardPage = () => {
  usePageTitle("My Account");
  const { data: profileData, isLoading, isError, isFetching, refetch } = useGetProfile();
  // Newest order only; the total count comes from the pagination
  const { data: ordersData, isLoading: isLoadingOrders } = useGetMyOrders({ limit: 1 });
  const { data: addressesData, isLoading: isLoadingAddresses } = useGetAddresses();
  const { data: wishlistIds } = useWishlistIds();
  const { data: cartCount = 0 } = useCartCount();
  const { data: walletBalance = 0 } = useWalletBalance();

  const profile = profileData?.data;
  const latestOrder = ordersData?.data?.[0];
  const orderCount = ordersData?.pagination?.total || 0;
  const defaultAddress = (addressesData?.data || []).find((address) => address.isDefault);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-40 animate-pulse rounded-3xl bg-slate-100" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
        <PanelSkeleton lines={3} />
      </div>
    );
  }
  if (isError || !profile) {
    return <SectionError message="We couldn't load your account." onRetry={refetch} isRetrying={isFetching} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <WelcomeCard profile={profile} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Package} label="Orders" value={orderCount} to={FRONTEND_ROUTES.ORDERS} />
        <StatTile icon={Heart} label="Wishlist items" value={wishlistIds?.size || 0} to={FRONTEND_ROUTES.WISHLIST} />
        <StatTile icon={ShoppingBag} label="Cart items" value={cartCount} to={FRONTEND_ROUTES.CART} />
        <StatTile icon={Wallet} label="Wallet balance" value={formatPaise(walletBalance)} to={FRONTEND_ROUTES.WALLET} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Latest Order"
          action={
            orderCount > 0 && (
              <Link to={FRONTEND_ROUTES.ORDERS} className={PANEL_LINK}>
                View all orders <ArrowRight size={14} aria-hidden="true" />
              </Link>
            )
          }
        >
          {isLoadingOrders ? <div className="h-24 animate-pulse rounded-xl bg-slate-100" /> : <LatestOrder order={latestOrder} />}
        </Panel>

        <Panel
          title="Default Address"
          action={
            defaultAddress && (
              <Link to={FRONTEND_ROUTES.PROFILE_ADDRESSES} className={PANEL_LINK}>
                Manage addresses <ArrowRight size={14} aria-hidden="true" />
              </Link>
            )
          }
        >
          {isLoadingAddresses && <div className="h-24 animate-pulse rounded-xl bg-slate-100" />}
          {!isLoadingAddresses && defaultAddress && <AddressCard address={defaultAddress} compact />}
          {!isLoadingAddresses && !defaultAddress && (
            <div className="flex flex-col items-start gap-2">
              <p className="flex items-center gap-2 text-[13.5px] text-slate-500">
                <MapPin size={15} aria-hidden="true" className="text-pink-300" />
                No saved address yet.
              </p>
              <Link to={FRONTEND_ROUTES.PROFILE_ADDRESSES} className={PANEL_LINK}>
                <Plus size={14} aria-hidden="true" /> Add your first address
              </Link>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Quick Links">
        <ul className="grid grid-cols-3 gap-3">
          {QUICK_LINKS.map(({ label, icon: Icon, to }) => (
            <li key={label}>
              <Link
                to={to}
                className={`flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-100 bg-[#fff5fa]/60 text-[13px] font-bold text-[#1e1a3a] hover:border-pink-200 hover:text-[#d6008a] transition-colors ${FOCUS_RING}`}
              >
                <Icon size={20} aria-hidden="true" className="text-[#d6008a]" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      {/* Phones: the footer is hidden, so its info / help links live here (and in the menu drawer) */}
      <nav aria-label="Info" className="md:hidden">
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white">
          {INFO_LINKS.map(({ label, icon: Icon, to }) => (
            <li key={label}>
              <Link
                to={to}
                className={`flex min-h-12 items-center gap-3 px-4 text-[14px] font-semibold text-slate-600 hover:bg-[#fff5fa] hover:text-[#d6008a] transition-colors ${FOCUS_RING}`}
              >
                <Icon size={17} aria-hidden="true" className="text-[#7c3aed]" />
                <span className="flex-1">{label}</span>
                <ChevronRight size={16} aria-hidden="true" className="text-slate-300" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default ProfileDashboardPage;
