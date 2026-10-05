import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { AlertCircle, Loader2 } from "lucide-react";
import Modal from "../../common/Modal";
import { useCancelAdminOrder } from "../../../hooks/Admin/OrderHooks";
import { CANCEL_REASONS } from "../../../utils/order";
import { getErrorMessage } from "../../../utils/errorMessage";
import { ADMIN_DANGER_BUTTON, ADMIN_INPUT, ADMIN_LABEL, ADMIN_SECONDARY_BUTTON } from "./adminOrderStyles";

// Same rules as the backend cancelSchema: a reason is required
const cancelSchema = z.object({
  reason: z.enum(
    CANCEL_REASONS.map((reason) => reason.value),
    { error: "Choose a reason" }
  ),
  note: z.string().trim().max(300, "Note can be at most 300 characters"),
});

const CancelForm = ({ order, onDone }) => {
  const formId = useId();
  const cancel = useCancelAdminOrder();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(cancelSchema), mode: "onTouched", defaultValues: { reason: "", note: "" } });

  const onSubmit = ({ reason, note }) =>
    cancel.mutate(
      { id: order._id, reason, note },
      {
        onSuccess: () => {
          toast.success(`Order ${order.orderNumber} cancelled`);
          onDone();
        },
      }
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {cancel.isError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] font-semibold text-rose-600">
          {getErrorMessage(cancel.error, "Couldn't cancel this order.")}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${formId}-reason`} className={ADMIN_LABEL}>
          Reason
        </label>
        <select id={`${formId}-reason`} className={ADMIN_INPUT} {...register("reason")}>
          <option value="">Select a reason…</option>
          {CANCEL_REASONS.map((reason) => (
            <option key={reason.value} value={reason.value}>
              {reason.label}
            </option>
          ))}
        </select>
        {errors.reason && (
          <p className="flex items-center gap-1 text-[12px] font-semibold text-rose-500">
            <AlertCircle size={13} aria-hidden="true" />
            {errors.reason.message}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${formId}-note`} className={ADMIN_LABEL}>
          Note <span className="font-medium normal-case tracking-normal text-slate-400">(optional, shown to the customer)</span>
        </label>
        <textarea id={`${formId}-note`} rows={3} maxLength={300} className={`${ADMIN_INPUT} h-auto py-2.5`} {...register("note")} />
        {errors.note && <p className="text-[12px] font-semibold text-rose-500">{errors.note.message}</p>}
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onDone} className={ADMIN_SECONDARY_BUTTON}>
          Keep order
        </button>
        <button type="submit" disabled={cancel.isPending} className={ADMIN_DANGER_BUTTON}>
          {cancel.isPending && <Loader2 size={16} aria-hidden="true" className="animate-spin" />}
          Cancel order
        </button>
      </div>
    </form>
  );
};

/** Cancels every active item (stock goes back). Allowed while confirmed or shipped. */
const AdminCancelOrderModal = ({ open, order, onClose }) => (
  <Modal open={open} title="Cancel this order?" description="All active items are cancelled and restocked. The customer sees the reason." onClose={onClose}>
    {order && <CancelForm order={order} onDone={onClose} />}
  </Modal>
);

export default AdminCancelOrderModal;
