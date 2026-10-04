import { Fragment } from "react";
import { Check, Clock, PackageCheck, RotateCcw, X } from "lucide-react";
import { ORDER_STATUS_LABELS, TRACKING_STEPS, formatShortDate } from "../../utils/order";

// How far along the happy path each order status is (index into TRACKING_STEPS)
const STEP_INDEX = {
  pending: -1,
  pending_payment: -1,
  confirmed: 0,
  partially_cancelled: 0,
  shipped: 1,
  out_for_delivery: 2,
  delivered: 3,
  return_requested: 3,
  returned: 3,
  partially_returned: 3,
};

// End states after (or instead of) delivery; full class strings
const END_STATES = {
  pending_payment: { label: "Awaiting payment", icon: Clock, dot: "bg-amber-500 text-white", text: "text-amber-700" },
  cancelled: { label: "Cancelled", icon: X, dot: "bg-rose-500 text-white", text: "text-rose-600" },
  payment_failed: { label: "Payment failed", icon: X, dot: "bg-rose-500 text-white", text: "text-rose-600" },
  payment_expired: { label: "Payment expired", icon: X, dot: "bg-rose-500 text-white", text: "text-rose-600" },
  return_requested: { label: "Return requested", icon: RotateCcw, dot: "bg-amber-500 text-white", text: "text-amber-700" },
  returned: { label: "Returned", icon: PackageCheck, dot: "bg-slate-600 text-white", text: "text-slate-700" },
  partially_returned: { label: "Partially returned", icon: PackageCheck, dot: "bg-slate-600 text-white", text: "text-slate-700" },
};

// Latest time the history reached `status`
const reachedAt = (history, status) =>
  [...history].reverse().find((entry) => entry.status === status)?.at;

const Dot = ({ done, current, children, className }) => (
  <span
    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
      className || (done ? "bg-[#d6008a] text-white" : current ? "border-2 border-[#d6008a] bg-white text-[#d6008a]" : "border border-slate-200 bg-white text-slate-400")
    }`}
  >
    {children}
  </span>
);

const Connector = ({ filled }) => (
  <span
    aria-hidden="true"
    className={`ml-[15px] h-6 w-0.5 rounded-full md:ml-0 md:h-0.5 md:w-auto md:flex-1 md:self-start md:mt-[15px] ${filled ? "bg-[#d6008a]" : "bg-slate-200"}`}
  />
);

/**
 * Confirmed → Shipped → Out for delivery → Delivered, filled up to the order's status with the dates from its
 * history. Cancelled / returned orders end in a rose / amber / slate step. Vertical on phones, horizontal from md.
 */
const TrackingStepper = ({ order }) => {
  const history = order.statusHistory || [];
  // Closed orders show how far they got (an unpaid one never got past the start)
  const isCancelled = ["cancelled", "payment_failed", "payment_expired"].includes(order.orderStatus);
  // A cancelled order shows how far it got before the cancellation
  const reached = isCancelled
    ? TRACKING_STEPS.reduce((last, step, index) => (reachedAt(history, step) ? index : last), 0)
    : STEP_INDEX[order.orderStatus] ?? 0;
  const end = END_STATES[order.orderStatus];
  // "Partially returned" etc. read better after Delivered; cancelled replaces the steps not reached
  const neverConfirmed = !reachedAt(history, "confirmed");
  const steps = isCancelled ? (neverConfirmed ? [] : TRACKING_STEPS.slice(0, reached + 1)) : TRACKING_STEPS;

  return (
    <ol aria-label="Order progress" className="flex flex-col md:flex-row md:items-start">
      {steps.map((step, index) => {
        const done = index <= reached;
        const isCurrent = index === reached && !end;
        const at = reachedAt(history, step);
        return (
          <Fragment key={step}>
            {index > 0 && <Connector filled={done} />}
            <li
              aria-current={isCurrent ? "step" : undefined}
              className="flex items-center gap-3 md:w-24 md:flex-shrink-0 md:flex-col md:gap-1.5 md:text-center"
            >
              <Dot done={done} current={isCurrent}>
                {done ? <Check size={15} strokeWidth={3} aria-hidden="true" /> : index + 1}
              </Dot>
              <span className="min-w-0">
                <span className={`block text-[13px] font-bold ${done ? "text-[#1e1a3a]" : "text-slate-400"}`}>
                  {ORDER_STATUS_LABELS[step]}
                </span>
                {done && at && <span className="block text-[11.5px] text-slate-500">{formatShortDate(at)}</span>}
                {!done && <span className="sr-only">Not yet</span>}
              </span>
            </li>
          </Fragment>
        );
      })}
      {end && (
        <>
          {steps.length > 0 && <Connector filled />}
          <li aria-current="step" className="flex items-center gap-3 md:w-24 md:flex-shrink-0 md:flex-col md:gap-1.5 md:text-center">
            <Dot className={end.dot}>
              <end.icon size={15} strokeWidth={2.5} aria-hidden="true" />
            </Dot>
            <span className="min-w-0">
              <span className={`block text-[13px] font-bold ${end.text}`}>{end.label}</span>
              {reachedAt(history, order.orderStatus) && (
                <span className="block text-[11.5px] text-slate-500">{formatShortDate(reachedAt(history, order.orderStatus))}</span>
              )}
            </span>
          </li>
        </>
      )}
    </ol>
  );
};

export default TrackingStepper;
