import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { AlertCircle, Loader2 } from "lucide-react";
import Modal from "../common/Modal";
import { useCancelOrder } from "../../hooks/Order/OrderHooks";
import { FOCUS_RING } from "../../constants/customerTheme";
import { CANCEL_REASONS } from "../../utils/order";
import { formatPrice } from "../../utils/product";
import { getErrorMessage } from "../../utils/errorMessage";

// Same rules as middlewares/order.validation.js cancelSchema (backend)
const cancelSchema = z.object({
  reason: z.enum(
    CANCEL_REASONS.map((reason) => reason.value),
    { error: "Choose a reason for cancelling" }
  ),
  note: z.string().trim().max(300, "Note can be at most 300 characters"),
});

// Mounted fresh each time the modal opens (Modal unmounts its content when closed)
const CancelForm = ({ order, item, onDone, onKeep }) => {
  const formId = useId();
  const cancel = useCancelOrder();
  const targets = item ? [item] : order.items.filter((line) => line.status === "active");
  const amount = targets.reduce((total, line) => total + line.lineTotal, 0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(cancelSchema), mode: "onTouched", defaultValues: { reason: undefined, note: "" } });

  const onSubmit = ({ reason, note }) =>
    cancel.mutate(
      { orderId: order._id, itemId: item?._id, reason, note },
      {
        onSuccess: () => {
          toast.success(item ? "Item cancelled" : "Order cancelled", { id: "order-cancelled" });
          onDone();
        },
      }
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {cancel.isError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] font-semibold text-rose-600">
          {getErrorMessage(cancel.error, "Couldn't cancel. Please try again.")}
        </p>
      )}

      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-[12px] font-bold uppercase tracking-wide text-slate-500">You&apos;re cancelling</p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {targets.map((line) => (
            <li key={line._id} className="flex justify-between gap-3 text-[13px]">
              <span className="min-w-0 text-slate-700">
                {line.name} <span className="text-slate-400">× {line.quantity}</span>
              </span>
              <span className="flex-shrink-0 font-semibold text-[#1e1a3a]">{formatPrice(line.lineTotal)}</span>
            </li>
          ))}
        </ul>
        {targets.length > 1 && (
          <p className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-[13px] font-bold text-[#1e1a3a]">
            <span>Total</span>
            <span>{formatPrice(amount)}</span>
          </p>
        )}
      </div>

      <fieldset>
        <legend className="mb-2 text-[12px] font-bold uppercase tracking-wide text-slate-500">Why are you cancelling?</legend>
        <div className="flex flex-col gap-2">
          {CANCEL_REASONS.map((reason) => (
            <label
              key={reason.value}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3.5 text-[13.5px] font-medium text-slate-700 has-[:checked]:border-[#d6008a] has-[:checked]:bg-[#fff5fa]"
            >
              <input type="radio" value={reason.value} className="h-4 w-4 accent-[#d6008a]" {...register("reason")} />
              {reason.label}
            </label>
          ))}
        </div>
        {errors.reason && (
          <p className="mt-1.5 flex items-center gap-1 text-[12px] font-semibold text-rose-500">
            <AlertCircle size={13} aria-hidden="true" />
            {errors.reason.message}
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${formId}-note`} className="text-[12px] font-bold uppercase tracking-wide text-slate-500">
          Note <span className="font-medium normal-case tracking-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id={`${formId}-note`}
          rows={2}
          maxLength={300}
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[14px] text-slate-800 outline-none focus:border-[#d6008a] focus:shadow-[0_0_0_3px_rgba(214,0,138,0.12)]"
          {...register("note")}
        />
        {errors.note && <p className="text-[12px] font-semibold text-rose-500">{errors.note.message}</p>}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onKeep}
          className={`inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-[14px] font-bold text-slate-600 hover:bg-slate-50 ${FOCUS_RING}`}
        >
          Keep order
        </button>
        <button
          type="submit"
          disabled={cancel.isPending}
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-full bg-rose-600 px-5 text-[14px] font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`}
        >
          {cancel.isPending && <Loader2 size={16} aria-hidden="true" className="animate-spin" />}
          Yes, cancel
        </button>
      </div>
    </form>
  );
};

/** Cancel the whole order (`item` null) or one item. Stock goes back and totals update on the server. */
const CancelOrderModal = ({ open, order, item, onClose }) => (
  <Modal
    open={open}
    title={item ? "Cancel this item?" : "Cancel this order?"}
    description="Cancelled items can't be restored. You won't be charged for them."
    onClose={onClose}
  >
    {order && <CancelForm order={order} item={item} onDone={onClose} onKeep={onClose} />}
  </Modal>
);

export default CancelOrderModal;
