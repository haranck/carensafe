import { useEffect, useId, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { AlertCircle, CheckCircle2, Loader2, MapPin } from "lucide-react";
import Modal from "../common/Modal";
import LocationSection from "../Address/LocationSection";
import { useCreateAddress, useUpdateAddress } from "../../hooks/Address/AddressHooks";
import { usePincodeLookup } from "../../hooks/Address/LocationHooks";
import { INDIAN_STATES } from "../../constants/indianStates";
import { BRAND_GRADIENT, FOCUS_RING } from "../../constants/customerTheme";
import { getErrorMessage } from "../../utils/errorMessage";
import { PINCODE_PATTERN, sameState, toKnownState } from "../../utils/pincode";

const ADDRESS_TYPES = ["Home", "Work", "Other"];
const PINCODE_DELAY = 500;
// Fields the map / pincode lookup may fill. line1 (house / flat no.) never is.
const AUTO_FILL_FIELDS = ["line2", "city", "district", "state", "pincode"];

// Same rules as middlewares/address.validation.js (backend)
const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(60, "Full name can be at most 60 characters"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  pincode: z.string().trim().regex(PINCODE_PATTERN, "Enter a valid 6-digit pincode"),
  line1: z
    .string()
    .trim()
    .min(3, "House / flat / building must be at least 3 characters")
    .max(120, "House / flat / building can be at most 120 characters"),
  line2: z.string().trim().max(120, "Area / street can be at most 120 characters"),
  landmark: z.string().trim().max(80, "Landmark can be at most 80 characters"),
  city: z.string().trim().min(2, "City is required").max(50, "City can be at most 50 characters"),
  district: z.string().trim().max(50, "District can be at most 50 characters"),
  state: z.string().min(1, "Select a state"),
  type: z.enum(ADDRESS_TYPES),
  isDefault: z.boolean(),
});

const INPUT =
  "h-11 w-full rounded-xl border bg-white px-3.5 text-[14px] text-slate-800 placeholder:text-slate-300 outline-none transition-colors focus:border-[#d6008a] focus:shadow-[0_0_0_3px_rgba(214,0,138,0.12)]";

const inputClass = (error) => `${INPUT} ${error ? "border-rose-400" : "border-slate-200"}`;

// Label + control + error under it
const Field = ({ id, label, optional = false, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-[12px] font-bold uppercase tracking-wide text-slate-500">
      {label}
      {optional && <span className="ml-1 font-medium normal-case tracking-normal text-slate-400">(optional)</span>}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-[12px] font-semibold text-rose-500">
        <AlertCircle size={13} aria-hidden="true" />
        {error.message}
      </p>
    )}
  </div>
);

const toFormValues = (address) => ({
  fullName: address?.fullName || "",
  phone: address?.phone || "",
  pincode: address?.pincode || "",
  line1: address?.line1 || "",
  line2: address?.line2 || "",
  landmark: address?.landmark || "",
  city: address?.city || "",
  district: address?.district || "",
  state: address?.state || "",
  type: address?.type || "Home",
  isDefault: Boolean(address?.isDefault),
});

// `value`, once it has stopped changing for `delay` ms
const useDebouncedValue = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

// Map results with a state we know, empty parts dropped
const toFillValues = (fields) =>
  Object.fromEntries(
    AUTO_FILL_FIELDS.map((name) => [name, name === "state" ? toKnownState(fields[name]) : (fields[name] || "").trim()]).filter(
      ([, value]) => value
    )
  );

/**
 * Add / edit form. Mounted fresh each time the modal opens (Modal unmounts its content when closed), so the defaults
 * always fit. Also rendered inline on the checkout page when there are no addresses. onDone(savedAddress).
 */
export const AddressForm = ({ address, isFirst, onDone }) => {
  const formId = useId();
  const fieldId = (name) => `${formId}-${name}`;
  const isEdit = Boolean(address);
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const mutation = isEdit ? update : create;

  // Map pin [lng, lat] and Mapbox's address for it, sent with the address
  const [coords, setCoords] = useState(address?.location?.coordinates || null);
  const [formattedAddress, setFormattedAddress] = useState(address?.formattedAddress || "");
  // Location results waiting for "Replace / Keep mine" (the user had typed an address already)
  const [pendingFill, setPendingFill] = useState(null);
  const [showLine1Hint, setShowLine1Hint] = useState(false);
  // What the map last filled in, so its own values don't count as "typed by the user"
  const lastFillRef = useRef({});

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm({ resolver: zodResolver(addressSchema), mode: "onTouched", defaultValues: toFormValues(address) });

  const [pincode = "", state = "", line1 = ""] = useWatch({ control, name: ["pincode", "state", "line1"] });
  const trimmedPincode = pincode.trim();
  const debouncedPincode = useDebouncedValue(trimmedPincode, PINCODE_DELAY);
  const isValidPincode = PINCODE_PATTERN.test(trimmedPincode);
  const lookupPincode = isValidPincode && debouncedPincode === trimmedPincode ? debouncedPincode : "";
  const pinLookup = usePincodeLookup(lookupPincode);
  // Fail open: when the lookup service is down only the format check applies
  const pinInfo = lookupPincode && pinLookup.isSuccess ? pinLookup.data : undefined;
  const isCheckingPincode = isValidPincode && (!lookupPincode || pinLookup.isFetching);
  const stateMismatch = Boolean(pinInfo?.state && state && toKnownState(pinInfo.state) && !sameState(state, pinInfo.state));

  // A pincode India Post knows fills an empty city / district / state
  useEffect(() => {
    if (!pinInfo) return;
    const fill = { city: pinInfo.city, district: pinInfo.district, state: toKnownState(pinInfo.state) };
    Object.entries(fill).forEach(([name, value]) => {
      if (value && !getValues(name).trim()) setValue(name, value, { shouldValidate: true, shouldDirty: true });
    });
  }, [pinInfo, getValues, setValue]);

  const applyFill = (values, replace) => {
    Object.entries(values).forEach(([name, value]) => {
      if (replace || !getValues(name).trim()) setValue(name, value, { shouldValidate: true, shouldDirty: true });
    });
    lastFillRef.current = { ...lastFillRef.current, ...values };
    setPendingFill(null);
  };

  const handleAddressFound = (fields, source) => {
    setFormattedAddress(fields.formattedAddress || "");
    const values = toFillValues(fields);
    const hasTyped = AUTO_FILL_FIELDS.some((name) => {
      const current = getValues(name).trim();
      return current && current !== (lastFillRef.current[name] || "");
    });
    if (hasTyped) setPendingFill(values);
    else applyFill(values, true);

    // The map can't know the house / flat number: send the user there
    if (source === "locate" && !getValues("line1").trim()) {
      setShowLine1Hint(true);
      setFocus("line1");
    }
  };

  const onSubmit = (data) => {
    if (stateMismatch) return;
    const payload = {
      ...data,
      // GeoJSON order [lng, lat], same as the API
      ...(coords && { location: { coordinates: coords } }),
      ...(coords && formattedAddress && { formattedAddress }),
    };
    const options = {
      onSuccess: (response) => {
        toast.success(isEdit ? "Address updated" : "Address added", { id: "address-saved" });
        onDone(response.data);
      },
    };
    if (isEdit) update.mutate({ id: address._id, data: payload }, options);
    else create.mutate(payload, options);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {mutation.isError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] font-semibold text-rose-600">
          {getErrorMessage(mutation.error, "Couldn't save this address. Please try again.")}
        </p>
      )}

      <LocationSection
        initialCoords={address?.location?.coordinates}
        initialFormattedAddress={address?.formattedAddress}
        onCoordsChange={setCoords}
        onAddressFound={handleAddressFound}
      />

      {pendingFill && (
        <div role="alertdialog" aria-label="Replace address" className="flex flex-col gap-3 rounded-2xl border border-pink-200 bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-[13px] font-semibold text-[#1e1a3a]">
            <MapPin size={16} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-[#d6008a]" />
            Replace the address with your current location?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => applyFill(pendingFill, false)}
              className={`inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 ${FOCUS_RING}`}
            >
              Keep mine
            </button>
            <button
              type="button"
              onClick={() => applyFill(pendingFill, true)}
              className={`inline-flex h-10 items-center rounded-full bg-[#d6008a] px-4 text-[13px] font-bold text-white hover:bg-[#9d0063] ${FOCUS_RING}`}
            >
              Replace
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={fieldId("fullName")} label="Full name" error={errors.fullName}>
          <input id={fieldId("fullName")} autoComplete="name" className={inputClass(errors.fullName)} {...register("fullName")} />
        </Field>
        <Field id={fieldId("phone")} label="Phone number" error={errors.phone}>
          <input
            id={fieldId("phone")}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            autoComplete="tel-national"
            placeholder="9876543210"
            className={inputClass(errors.phone)}
            {...register("phone")}
          />
        </Field>
      </div>

      <Field id={fieldId("line1")} label="House / flat / building" error={errors.line1}>
        <input id={fieldId("line1")} autoComplete="address-line1" className={inputClass(errors.line1)} {...register("line1")} />
        {showLine1Hint && !line1.trim() && !errors.line1 && (
          <p className="text-[12px] font-semibold text-[#d6008a]">Add your house / flat number</p>
        )}
      </Field>
      <Field id={fieldId("line2")} label="Area / street" optional error={errors.line2}>
        <input id={fieldId("line2")} autoComplete="address-line2" className={inputClass(errors.line2)} {...register("line2")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={fieldId("landmark")} label="Landmark" optional error={errors.landmark}>
          <input id={fieldId("landmark")} className={inputClass(errors.landmark)} {...register("landmark")} />
        </Field>
        <Field id={fieldId("pincode")} label="Pincode" error={errors.pincode}>
          <input
            id={fieldId("pincode")}
            inputMode="numeric"
            maxLength={6}
            autoComplete="postal-code"
            aria-describedby={fieldId("pincode-status")}
            className={inputClass(errors.pincode)}
            {...register("pincode")}
          />
          <div id={fieldId("pincode-status")} aria-live="polite" className="empty:hidden">
            {!errors.pincode && isCheckingPincode && (
              <p className="flex items-center gap-1 text-[12px] text-slate-500">
                <Loader2 size={13} aria-hidden="true" className="animate-spin" />
                Checking pincode…
              </p>
            )}
            {!errors.pincode && !isCheckingPincode && pinInfo && (
              <p className="flex items-center gap-1 text-[12px] font-semibold text-emerald-600">
                <CheckCircle2 size={13} aria-hidden="true" />
                {[pinInfo.city, pinInfo.state].filter(Boolean).join(", ")}
              </p>
            )}
            {!errors.pincode && !isCheckingPincode && pinInfo === null && (
              <p className="flex items-center gap-1 text-[12px] font-semibold text-rose-500">
                <AlertCircle size={13} aria-hidden="true" />
                Pincode not found. Please check it.
              </p>
            )}
          </div>
        </Field>
        <Field id={fieldId("city")} label="City" error={errors.city}>
          <input id={fieldId("city")} autoComplete="address-level2" className={inputClass(errors.city)} {...register("city")} />
        </Field>
        <Field id={fieldId("district")} label="District" optional error={errors.district}>
          <input id={fieldId("district")} className={inputClass(errors.district)} {...register("district")} />
        </Field>
        <Field
          id={fieldId("state")}
          label="State"
          error={errors.state || (stateMismatch && { message: `Pincode ${trimmedPincode} is in ${toKnownState(pinInfo.state)}. Fix the pincode or state.` })}
        >
          <select
            id={fieldId("state")}
            autoComplete="address-level1"
            className={inputClass(errors.state || stateMismatch)}
            {...register("state")}
          >
            <option value="">Select state</option>
            {INDIAN_STATES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">Address type</legend>
        <div className="flex flex-wrap gap-2">
          {ADDRESS_TYPES.map((type) => (
            <label key={type} className="cursor-pointer">
              <input type="radio" value={type} className="peer sr-only" {...register("type")} />
              <span className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-600 transition-colors peer-checked:border-pink-200 peer-checked:bg-[#fff5fa] peer-checked:text-[#d6008a] peer-focus-visible:ring-2 peer-focus-visible:ring-[#d6008a]/30">
                {type}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {address?.isDefault || isFirst ? (
        <p className="text-[12.5px] text-slate-500">
          {isFirst ? "Your first address becomes your default." : "This is your default address."}
        </p>
      ) : (
        <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-[13.5px] font-medium text-slate-700">
          <input type="checkbox" className="h-4 w-4 accent-[#d6008a]" {...register("isDefault")} />
          Make this my default address
        </label>
      )}

      <button
        type="submit"
        disabled={mutation.isPending || stateMismatch}
        className={`mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-bold text-white ${BRAND_GRADIENT} shadow-[0_6px_18px_rgba(124,58,237,0.28)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 transition-all ${FOCUS_RING}`}
      >
        {mutation.isPending && <Loader2 size={18} aria-hidden="true" className="animate-spin" />}
        {isEdit ? "Save Address" : "Add Address"}
      </button>
    </form>
  );
};

/**
 * Add / edit address. `address` null → add; `isFirst` → it will become the default.
 * `onSaved(address)` runs with the saved address before the modal closes (checkout selects it).
 */
const AddressFormModal = ({ open, address, isFirst, onClose, onSaved }) => (
  <Modal open={open} title={address ? "Edit Address" : "Add New Address"} size="lg" onClose={onClose}>
    <AddressForm
      address={address}
      isFirst={isFirst}
      onDone={(saved) => {
        onSaved?.(saved);
        onClose();
      }}
    />
  </Modal>
);

export default AddressFormModal;
