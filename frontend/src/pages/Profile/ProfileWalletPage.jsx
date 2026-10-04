import { Receipt, Sparkles, Wallet } from "lucide-react";
import ProfileHeading from "../../components/Profile/ProfileHeading";
import Panel from "../../components/Profile/Panel";
import { BRAND_GRADIENT } from "../../constants/customerTheme";

const ZERO_BALANCE = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(0);

// No wallet backend yet: a ₹0.00 balance and an empty history, no money logic
const ProfileWalletPage = () => (
  <>
    <ProfileHeading accent="Wallet" description="Refunds and rewards will land here." />
    <div className="flex flex-col gap-4">
      <section className={`relative overflow-hidden rounded-3xl p-6 text-white sm:p-8 ${BRAND_GRADIENT}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold text-white/80">Wallet Balance</p>
            <p className="mt-1 text-[36px] font-extrabold leading-tight sm:text-[42px]">{ZERO_BALANCE}</p>
          </div>
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <Wallet size={24} aria-hidden="true" />
          </span>
        </div>
        <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[12px] font-bold">
          <Sparkles size={13} aria-hidden="true" />
          Coming soon
        </span>
      </section>

      <Panel title="Transactions">
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff5fa]">
            <Receipt size={30} strokeWidth={1.6} aria-hidden="true" className="text-pink-300" />
          </span>
          <p className="text-[15px] font-extrabold text-[#1e1a3a]">No transactions yet</p>
          <p className="max-w-[320px] text-[13px] text-slate-500">
            Your wallet is coming soon. Refunds and cashback will show up here.
          </p>
        </div>
      </Panel>
    </div>
  </>
);

export default ProfileWalletPage;
