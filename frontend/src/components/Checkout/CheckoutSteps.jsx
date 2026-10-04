import { Fragment } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { FRONTEND_ROUTES } from "../../constants/frontendRoutes";
import { FOCUS_RING } from "../../constants/customerTheme";

const STEPS = ["Cart", "Address", "Payment"];

// Full class strings per state (no dynamic Tailwind names)
const DOT = {
  done: "bg-[#d6008a] text-white",
  current: "border-2 border-[#d6008a] bg-white text-[#d6008a]",
  upcoming: "border border-slate-200 bg-white text-slate-400",
};
const LABEL = { done: "text-[#1e1a3a]", current: "text-[#d6008a]", upcoming: "text-slate-400" };

const stepState = (index, current) => {
  if (index < current) return "done";
  return index === current ? "current" : "upcoming";
};

/** Cart → Address → Payment. `current`: 1 (choosing an address) or 2 (choosing payment); Cart is always done. */
const CheckoutSteps = ({ current }) => (
  <ol aria-label="Checkout steps" className="flex items-center gap-2 sm:gap-3">
    {STEPS.map((label, index) => {
      const state = stepState(index, current);
      const content = (
        <>
          <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${DOT[state]}`}>
            {state === "done" ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : index + 1}
          </span>
          <span className={`text-[13px] font-bold sm:text-[14px] ${LABEL[state]}`}>{label}</span>
        </>
      );
      return (
        <Fragment key={label}>
          {index > 0 && (
            <li aria-hidden="true" className={`h-0.5 w-6 flex-shrink rounded-full sm:w-12 ${index <= current ? "bg-[#d6008a]" : "bg-slate-200"}`} />
          )}
          <li aria-current={state === "current" ? "step" : undefined}>
            {index === 0 ? (
              <Link to={FRONTEND_ROUTES.CART} className={`flex min-h-10 items-center gap-2 rounded-full pr-1 ${FOCUS_RING}`}>
                {content}
              </Link>
            ) : (
              <span className="flex min-h-10 items-center gap-2">{content}</span>
            )}
          </li>
        </Fragment>
      );
    })}
  </ol>
);

export default CheckoutSteps;
