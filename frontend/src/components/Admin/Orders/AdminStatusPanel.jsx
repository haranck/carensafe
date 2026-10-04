import { useId } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { AlertCircle, Loader2 } from "lucide-react";
import { useUpdateAdminOrderStatus } from "../../../hooks/Admin/OrderHooks";
import { ORDER_STATUS_LABELS } from "../../../utils/order";
import { getErrorMessage } from "../../../utils/errorMessage";
import { ADMIN_CARD, ADMIN_INPUT, ADMIN_LABEL, ADMIN_PRIMARY_BUTTON } from "./adminOrderStyles";

// Same rules as middlewares/admin.order.validation.js updateStatusSchema (backend)
const statusSchema = z
  .object({
    status: z.string().min(1, "Choose the next status"),
    courier: z.string().trim().max(60, "Courier can be at most 60 characters"),
    trackingNumber: z.string().trim().max(60, "Tracking number can be at most 60 characters"),
    trackingUrl: z.union([z.literal(""), z.url({ protocol: /^https?$/, error: "Enter a valid http(s) link" })]),
    expectedDelivery: z.string(),
    note: z.string().trim().max(300, "Note can be at most 300 characters"),
  })
  .superRefine((data, ctx) => {
    if (data.status !== "shipped") return;
    if (!data.courier) ctx.addIssue({ code: "custom", path: ["courier"], message: "Courier is required to mark an order as shipped" });
    if (!data.trackingNumber)
      ctx.addIssue({ code: "custom", path: ["trackingNumber"], message: "Tracking number is required to mark an order as shipped" });
  });

const DEFAULTS = { status: "", courier: "", trackingNumber: "", trackingUrl: "", expectedDelivery: "", note: "" };

const FieldError = ({ error }) =>
  error ? (
    <p className="flex items-center gap-1 text-[12px] font-semibold text-rose-500">
      <AlertCircle size={13} aria-hidden="true" />
      {error.message}
    </p>
  ) : null;

/** Moves the order one step forward. Only the API's allowedNextStatuses are offered; shipping asks for tracking. */
const AdminStatusPanel = ({ order }) => {
  const formId = useId();
  const id = (name) => `${formId}-${name}`;
  const update = useUpdateAdminOrderStatus();
  const next = order.allowedNextStatuses || [];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(statusSchema), mode: "onTouched", defaultValues: DEFAULTS });
  const status = useWatch({ control, name: "status" });
  const isShipping = status === "shipped";

  const onSubmit = (data) =>
    update.mutate(
      { id: order._id, ...data },
      {
        onSuccess: () => {
          toast.success(`Order marked as ${ORDER_STATUS_LABELS[data.status].toLowerCase()}`);
          reset(DEFAULTS);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Couldn't update the status.")),
      }
    );

  return (
    <section className={`${ADMIN_CARD} p-5`}>
      <h2 className="text-[16px] font-bold text-slate-800">Update status</h2>
      {next.length === 0 ? (
        <p className="mt-2 text-[13px] text-slate-500">
          No further status changes for a {ORDER_STATUS_LABELS[order.orderStatus]?.toLowerCase()} order.
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={id("status")} className={ADMIN_LABEL}>
              Next status
            </label>
            <select id={id("status")} className={ADMIN_INPUT} {...register("status")}>
              <option value="">Select…</option>
              {next.map((value) => (
                <option key={value} value={value}>
                  {ORDER_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
            <FieldError error={errors.status} />
          </div>

          {isShipping && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={id("courier")} className={ADMIN_LABEL}>
                    Courier
                  </label>
                  <input id={id("courier")} placeholder="Delhivery" className={ADMIN_INPUT} {...register("courier")} />
                  <FieldError error={errors.courier} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={id("trackingNumber")} className={ADMIN_LABEL}>
                    Tracking number
                  </label>
                  <input id={id("trackingNumber")} className={ADMIN_INPUT} {...register("trackingNumber")} />
                  <FieldError error={errors.trackingNumber} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={id("trackingUrl")} className={ADMIN_LABEL}>
                  Tracking link <span className="font-medium normal-case tracking-normal text-slate-400">(optional)</span>
                </label>
                <input id={id("trackingUrl")} type="url" placeholder="https://" className={ADMIN_INPUT} {...register("trackingUrl")} />
                <FieldError error={errors.trackingUrl} />
              </div>
            </>
          )}

          {(isShipping || status === "out_for_delivery") && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={id("expectedDelivery")} className={ADMIN_LABEL}>
                Expected delivery <span className="font-medium normal-case tracking-normal text-slate-400">(optional)</span>
              </label>
              <input id={id("expectedDelivery")} type="date" className={ADMIN_INPUT} {...register("expectedDelivery")} />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor={id("note")} className={ADMIN_LABEL}>
              Note <span className="font-medium normal-case tracking-normal text-slate-400">(optional, shown to the customer)</span>
            </label>
            <textarea id={id("note")} rows={2} maxLength={300} className={`${ADMIN_INPUT} h-auto py-2.5`} {...register("note")} />
            <FieldError error={errors.note} />
          </div>

          <button type="submit" disabled={update.isPending} className={ADMIN_PRIMARY_BUTTON}>
            {update.isPending && <Loader2 size={16} aria-hidden="true" className="animate-spin" />}
            Update status
          </button>
        </form>
      )}
    </section>
  );
};

export default AdminStatusPanel;
