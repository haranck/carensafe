import { useId } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { AlertTriangle, Loader2 } from "lucide-react";
import Modal from "../common/Modal";
import { useRequestReturn } from "../../hooks/Order/OrderHooks";
import { FOCUS_RING } from "../../constants/customerTheme";
import { daysLeft } from "../../utils/order";
import { formatPrice } from "../../utils/product";
import { getErrorMessage } from "../../utils/errorMessage";

// Same rules as middlewares/order.validation.js returnSchema (backend); the reason is always size mismatch
const returnSchema = z.object({
  note: z.string().trim().max(300, "Note can be at most 300 characters"),
  packUnopenedConfirmed: z.literal(true, { error: "Confirm the pack is unopened and sealed" }),
});

const ReturnForm = ({ order, item, onDone, onKeep }) => {
  const formId = useId();
  const requestReturn = useRequestReturn();
  const targets = item ? [item] : order.items.filter((line) => line.status === "active");
  const remaining = daysLeft(order.returnWindowEndsAt);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({ resolver: zodResolver(returnSchema), mode: "onTouched", defaultValues: { note: "", packUnopenedConfirmed: false } });
  const isConfirmed = useWatch({ control, name: "packUnopenedConfirmed" });

  const onSubmit = ({ note, packUnopenedConfirmed }) =>
    requestReturn.mutate(
      { orderId: order._id, itemId: item?._id, note, packUnopenedConfirmed },
      {
        onSuccess: () => {
          toast.success("Return requested. We'll review it shortly.", { id: "return-requested" });
          onDone();
        },
      }
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[13px] font-semibold text-amber-800">
        <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 flex-shrink-0" />
        Returns are available only for size mismatch. Opened packs cannot be returned.
      </p>

      {requestReturn.isError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] font-semibold text-rose-600">
          {getErrorMessage(requestReturn.error, "Couldn't request the return. Please try again.")}
        </p>
      )}

      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-[12px] font-bold uppercase tracking-wide text-slate-500">Returning</p>
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
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${formId}-reason`} className="text-[12px] font-bold uppercase tracking-wide text-slate-500">
          Reason
        </label>
        <input
          id={`${formId}-reason`}
          value="Size mismatch"
          readOnly
          aria-readonly="true"
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-[14px] font-semibold text-slate-600 outline-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${formId}-note`} className="text-[12px] font-bold uppercase tracking-wide text-slate-500">
          Note <span className="font-medium normal-case tracking-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id={`${formId}-note`}
          rows={2}
          maxLength={300}
          placeholder="e.g. I need XL instead of XXL"
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[14px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-[#d6008a] focus:shadow-[0_0_0_3px_rgba(214,0,138,0.12)]"
          {...register("note")}
        />
        {errors.note && <p className="text-[12px] font-semibold text-rose-500">{errors.note.message}</p>}
      </div>

      <div>
        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-3.5 py-3 text-[13.5px] font-semibold text-slate-700 has-[:checked]:border-[#d6008a] has-[:checked]:bg-[#fff5fa]">
          <input type="checkbox" className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#d6008a]" {...register("packUnopenedConfirmed")} />
          I confirm the pack is unopened and sealed
        </label>
        {errors.packUnopenedConfirmed && <p className="mt-1.5 text-[12px] font-semibold text-rose-500">{errors.packUnopenedConfirmed.message}</p>}
      </div>

      {remaining !== null && (
        <p className="text-[12.5px] text-slate-500">
          {remaining === 0 ? "Today is the last day to request a return." : `${remaining} ${remaining === 1 ? "day" : "days"} left in the return window.`}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onKeep}
          className={`inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-[14px] font-bold text-slate-600 hover:bg-slate-50 ${FOCUS_RING}`}
        >
          Keep it
        </button>
        <button
          type="submit"
          disabled={!isConfirmed || requestReturn.isPending}
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-full bg-amber-600 px-5 text-[14px] font-bold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}
        >
          {requestReturn.isPending && <Loader2 size={16} aria-hidden="true" className="animate-spin" />}
          Request return
        </button>
      </div>
    </form>
  );
};

/** Return the whole order (`item` null) or one item: size mismatch only, unopened packs only. */
const ReturnOrderModal = ({ open, order, item, onClose }) => (
  <Modal open={open} title={item ? "Return this item?" : "Return this order?"} onClose={onClose}>
    {order && <ReturnForm order={order} item={item} onDone={onClose} onKeep={onClose} />}
  </Modal>
);

export default ReturnOrderModal;
