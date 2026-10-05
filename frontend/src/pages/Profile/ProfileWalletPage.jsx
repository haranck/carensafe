import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Info, Loader2, Plus, Receipt, Wallet } from "lucide-react";
import TopupModal from "../../components/Wallet/TopupModal";
import VerifyingOverlay from "../../components/Payment/VerifyingOverlay";
import { useStartTopup } from "../../hooks/Payment/PaymentHooks";
import { usePaymentFlow } from "../../hooks/Payment/usePaymentFlow";
import { getErrorMessage } from "../../utils/errorMessage";
import ProfileHeading from "../../components/Profile/ProfileHeading";
import Panel from "../../components/Profile/Panel";
import SectionError from "../../components/Home/SectionError";
import { useWallet, useWalletTransactions } from "../../hooks/Wallet/WalletHooks";
import { orderDetailPath } from "../../constants/frontendRoutes";
import { BRAND_GRADIENT, FOCUS_RING } from "../../constants/customerTheme";
import { formatPaise } from "../../utils/wallet";
import { formatDateTime } from "../../utils/order";
import { usePageTitle } from "../../hooks/common/usePageTitle";

const PAGE_SIZE = 10;
const FILTERS = [
  { value: "", label: "All" },
  { value: "credit", label: "Credits" },
  { value: "debit", label: "Debits" },
];
const PAGER_BUTTON = `inline-flex h-10 items-center gap-1 rounded-full border border-slate-200 bg-white px-4 text-[13px] font-bold text-slate-600 hover:border-pink-200 hover:text-[#d6008a] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING}`;

const BalanceCard = ({ onAddMoney, isAdding }) => {
  const { data, isLoading, isError } = useWallet();
  const balance = data?.data?.balance;

  return (
    <section className={`relative overflow-hidden rounded-3xl p-6 text-white sm:p-8 ${BRAND_GRADIENT}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-white/80">Care N Safe Wallet</p>
          {isLoading ? (
            <span className="mt-2 block h-11 w-40 animate-pulse rounded-xl bg-white/20" />
          ) : (
            <p className="mt-1 break-all text-[36px] font-extrabold leading-tight sm:text-[42px]" aria-live="polite">
              {isError ? "—" : formatPaise(balance)}
            </p>
          )}
        </div>
        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15">
          <Wallet size={24} aria-hidden="true" />
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onAddMoney}
          disabled={isLoading || isAdding}
          className={`inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-bold text-[#3b2a8a] shadow-sm hover:bg-[#fff5fa] disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`}
        >
          {isAdding ? <Loader2 size={16} aria-hidden="true" className="animate-spin" /> : <Plus size={16} aria-hidden="true" />}
          Add Money
        </button>
      </div>
      <p className="mt-4 flex items-start gap-2 text-[12.5px] text-white/85">
        <Info size={14} aria-hidden="true" className="mt-0.5 flex-shrink-0" />
        Use your balance at checkout. Refunds for prepaid orders land here instantly.
      </p>
    </section>
  );
};

const SOURCE_LABELS = { topup: "Top-up", order_payment: "Order payment", refund: "Refund", adjustment: "Adjustment" };

const TransactionRow = ({ transaction }) => {
  const isCredit = transaction.type === "credit";
  const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;
  return (
    <li className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
      <span
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${isCredit ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
      >
        <Icon size={18} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="break-words text-[13.5px] font-semibold text-[#1e1a3a]">{transaction.description || (isCredit ? "Credit" : "Debit")}</p>
        <p className="mt-0.5 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{SOURCE_LABELS[transaction.source] || transaction.source}</span>
          {transaction.status && transaction.status !== "completed" && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold capitalize text-amber-700">{transaction.status}</span>
          )}
        </p>
        <p className="mt-0.5 text-[12px] text-slate-500">
          {formatDateTime(transaction.createdAt)}
          {transaction.order?.orderNumber && (
            <>
              {" · "}
              <Link to={orderDetailPath(transaction.order._id)} className={`rounded font-semibold text-[#d6008a] hover:text-[#9d0063] ${FOCUS_RING}`}>
                {transaction.order.orderNumber}
              </Link>
            </>
          )}
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className={`text-[14.5px] font-extrabold ${isCredit ? "text-emerald-600" : "text-rose-600"}`}>
          {isCredit ? "+" : "−"}
          {formatPaise(transaction.amount)}
        </p>
        <p className="text-[11.5px] text-slate-400">Balance {formatPaise(transaction.balanceAfter)}</p>
      </div>
    </li>
  );
};

const ProfileWalletPage = () => {
  usePageTitle("My Wallet");
  const [type, setType] = useState("");
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const { data: walletData } = useWallet();
  const { mutate: startTopup, isPending: isStarting } = useStartTopup();
  const { pay, isBusy: isPaying, isVerifying } = usePaymentFlow();
  const limits = walletData?.data?.topup || { min: 100, max: 10000 };

  // Razorpay order for the amount → popup → verified → balance updates (the hooks refresh the wallet)
  const handleTopup = (amount) =>
    startTopup(amount, {
      onSuccess: (response) => {
        setIsTopupOpen(false);
        pay({
          checkout: response.data.razorpay,
          onSuccess: () => toast.success(`₹${amount.toLocaleString("en-IN")} added to your wallet`, { id: "topup-done" }),
          onUnconfirmed: () => toast("We're confirming your top-up. Your balance will update shortly.", { id: "topup-confirming" }),
        });
      },
      onError: (error) => toast.error(getErrorMessage(error, "Couldn't start the top-up. Please try again."), { id: "topup-error" }),
    });
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, isFetching, isPlaceholderData, refetch } = useWalletTransactions({ page, limit: PAGE_SIZE, type });
  const transactions = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  let content;
  if (isLoading) {
    content = (
      <ul aria-label="Loading transactions" className="flex flex-col gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />
            <span className="h-4 flex-1 animate-pulse rounded bg-slate-100" />
            <span className="h-4 w-16 animate-pulse rounded bg-slate-100" />
          </li>
        ))}
      </ul>
    );
  } else if (isError) {
    content = <SectionError message="We couldn't load your transactions." onRetry={refetch} isRetrying={isFetching} />;
  } else if (transactions.length === 0) {
    content = (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <span className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff5fa]">
          <Receipt size={30} strokeWidth={1.6} aria-hidden="true" className="text-pink-300" />
        </span>
        <p className="text-[15px] font-extrabold text-[#1e1a3a]">No transactions yet</p>
        <p className="max-w-[320px] text-[13px] text-slate-500">Refunds for online payments will show up here.</p>
      </div>
    );
  } else {
    content = (
      <>
        <ul className={`flex flex-col divide-y divide-slate-100 transition-opacity ${isPlaceholderData ? "opacity-60" : "opacity-100"}`}>
          {transactions.map((transaction) => (
            <TransactionRow key={transaction._id} transaction={transaction} />
          ))}
        </ul>
        {totalPages > 1 && (
          <nav aria-label="Transaction pages" className="mt-5 flex items-center justify-between gap-3">
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
      <ProfileHeading accent="Wallet" description="Refunds for online payments land here." />
      <div className="flex flex-col gap-4">
        <BalanceCard onAddMoney={() => setIsTopupOpen(true)} isAdding={isStarting || isPaying} />

        <Panel title="Transactions">
          <div role="group" aria-label="Filter transactions" className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((filter) => {
              const isActive = type === filter.value;
              return (
                <button
                  key={filter.label}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => {
                    setType(filter.value);
                    setPage(1);
                  }}
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
        </Panel>
      </div>

      <TopupModal
        open={isTopupOpen}
        onClose={() => setIsTopupOpen(false)}
        min={limits.min}
        max={limits.max}
        testMode={walletData?.data?.paymentMode === "test"}
        isPending={isStarting}
        onSubmit={handleTopup}
      />
      <VerifyingOverlay show={isVerifying} />
    </>
  );
};

export default ProfileWalletPage;
