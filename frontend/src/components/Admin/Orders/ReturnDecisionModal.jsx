import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import Modal from "../../common/Modal";
import { useDecideReturn } from "../../../hooks/Admin/OrderHooks";
import { getErrorMessage } from "../../../utils/errorMessage";
import { ADMIN_DANGER_BUTTON, ADMIN_INPUT, ADMIN_LABEL, ADMIN_PRIMARY_BUTTON, ADMIN_SECONDARY_BUTTON } from "./adminOrderStyles";

// Same rules as the backend decideReturnSchema: rejecting needs a reason (min 5), approving takes an optional note
const rejectSchema = z.object({
  adminReason: z.string().trim().min(5, "The reason must be at least 5 characters").max(300, "The reason can be at most 300 characters"),
});
const approveSchema = z.object({
  adminReason: z.string().trim().max(300, "The note can be at most 300 characters"),
});

const DecisionForm = ({ orderId, item, decision, onDone }) => {
  const formId = useId();
  const decide = useDecideReturn();
  const isReject = decision === "rejected";
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(isReject ? rejectSchema : approveSchema), mode: "onTouched", defaultValues: { adminReason: "" } });

  const onSubmit = ({ adminReason }) =>
    decide.mutate(
      { id: orderId, itemId: item._id, decision, adminReason },
      {
        onSuccess: () => {
          toast.success(isReject ? "Return rejected" : "Return approved");
          onDone();
        },
      }
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {decide.isError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] font-semibold text-rose-600">
          {getErrorMessage(decide.error, "Couldn't save the decision.")}
        </p>
      )}
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
        <span className="font-bold text-slate-800">{item.name}</span> × {item.quantity}
        {item.return?.note && <span className="mt-1 block">Customer note: “{item.return.note}”</span>}
      </p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${formId}-reason`} className={ADMIN_LABEL}>
          {isReject ? "Reason (shown to the customer)" : "Note for the customer (optional)"}
        </label>
        <textarea
          id={`${formId}-reason`}
          rows={3}
          maxLength={300}
          placeholder={isReject ? "e.g. The pack seal was broken." : "e.g. Please ship it within 5 days."}
          className={`${ADMIN_INPUT} h-auto py-2.5`}
          {...register("adminReason")}
        />
        {errors.adminReason && <p className="text-[12px] font-semibold text-rose-500">{errors.adminReason.message}</p>}
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onDone} className={ADMIN_SECONDARY_BUTTON}>
          Back
        </button>
        <button type="submit" disabled={decide.isPending} className={isReject ? ADMIN_DANGER_BUTTON : ADMIN_PRIMARY_BUTTON}>
          {decide.isPending && <Loader2 size={16} aria-hidden="true" className="animate-spin" />}
          {isReject ? "Reject return" : "Approve return"}
        </button>
      </div>
    </form>
  );
};

/** Approve (optional note) or reject (required reason) one return request. */
const ReturnDecisionModal = ({ open, orderId, item, decision, onClose }) => (
  <Modal open={open} title={decision === "rejected" ? "Reject this return?" : "Approve this return?"} onClose={onClose}>
    {item && <DecisionForm orderId={orderId} item={item} decision={decision} onDone={onClose} />}
  </Modal>
);

export default ReturnDecisionModal;
