import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const ACTION =
  "inline-flex h-9 flex-shrink-0 items-center rounded-full bg-[#fff5fa] px-3.5 text-[13px] font-bold text-[#d6008a] hover:bg-pink-100 hover:text-[#9d0063] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6008a]/30";

/**
 * Toast message with one action, for the white AppToast body: a link (`to`, e.g. "View cart") or a button
 * (`onAction`, e.g. "Undo"). Either one dismisses the toast.
 */
const CartActionToast = ({ message, actionLabel, to, onAction, toastId }) => (
  <span className="flex items-center justify-between gap-3">
    <span>{message}</span>
    {to ? (
      <Link to={to} onClick={() => toast.dismiss(toastId)} className={ACTION}>
        {actionLabel}
      </Link>
    ) : (
      <button
        type="button"
        onClick={() => {
          toast.dismiss(toastId);
          onAction();
        }}
        className={ACTION}
      >
        {actionLabel}
      </button>
    )}
  </span>
);

export default CartActionToast;
