import { useId, useState } from "react";
import { Briefcase, Home, MapPin, Pencil, Phone, Plus, Star } from "lucide-react";
import AddressFormModal, { AddressForm } from "../Profile/AddressFormModal";
import PanelSkeleton from "../Profile/PanelSkeleton";
import SectionError from "../Home/SectionError";
import StepCard from "./StepCard";
import { formatAddress } from "../../utils/address";
import { FOCUS_RING } from "../../constants/customerTheme";

// Same limit as the API (config/addresses.js)
const MAX_ADDRESSES = 10;
const TYPE_ICONS = { Home, Work: Briefcase, Other: MapPin };

const AddressOption = ({ address, name, checked, onSelect, onEdit }) => {
  const TypeIcon = TYPE_ICONS[address.type] || MapPin;
  return (
    <div
      className={`relative flex gap-3 rounded-2xl border p-3.5 transition-colors sm:p-4 ${checked ? "border-[#d6008a] bg-[#fff5fa]" : "border-slate-200 bg-white hover:border-pink-200"}`}
    >
      <input
        id={`${name}-${address._id}`}
        type="radio"
        name={name}
        value={address._id}
        checked={checked}
        onChange={() => onSelect(address._id)}
        className="mt-1 h-4 w-4 flex-shrink-0 cursor-pointer accent-[#d6008a]"
      />
      <label htmlFor={`${name}-${address._id}`} className="min-w-0 flex-1 cursor-pointer">
        <span className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-0.5 text-[11.5px] font-bold text-[#3b2a8a]">
            <TypeIcon size={13} aria-hidden="true" />
            {address.type}
          </span>
          {address.isDefault && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[11.5px] font-bold text-[#d6008a] ring-1 ring-pink-100">
              <Star size={12} aria-hidden="true" className="fill-current" />
              Default
            </span>
          )}
        </span>
        <span className="mt-2 block text-[14.5px] font-bold text-[#1e1a3a]">{address.fullName}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-slate-500">
          <Phone size={13} aria-hidden="true" />
          {address.phone}
        </span>
        <span className="mt-1.5 block break-words text-[13px] leading-relaxed text-slate-600">{formatAddress(address)}</span>
      </label>
      <button
        type="button"
        onClick={() => onEdit(address)}
        aria-label={`Edit address for ${address.fullName}`}
        className={`inline-flex h-10 flex-shrink-0 items-center gap-1 self-start rounded-full px-3 text-[12.5px] font-bold text-[#d6008a] hover:bg-white hover:text-[#9d0063] ${FOCUS_RING}`}
      >
        <Pencil size={13} aria-hidden="true" />
        Edit
      </button>
    </div>
  );
};

/**
 * Step 1: choose a saved address (radio cards), add / edit one in the address modal, or — with no addresses —
 * fill the form right here. A newly added address becomes the selected one.
 */
const AddressStep = ({ addressesQuery, selectedId, onSelect }) => {
  const headingId = useId();
  const radioName = useId();
  // undefined = closed, null = add, address = edit
  const [editing, setEditing] = useState(undefined);
  const { data, isLoading, isError, isFetching, refetch } = addressesQuery;
  const addresses = data?.data || [];
  const isFull = addresses.length >= MAX_ADDRESSES;

  let content;
  if (isLoading) {
    content = (
      <div className="flex flex-col gap-3">
        <PanelSkeleton lines={2} />
        <PanelSkeleton lines={2} />
      </div>
    );
  } else if (isError) {
    content = <SectionError message="We couldn't load your addresses." onRetry={refetch} isRetrying={isFetching} />;
  } else if (addresses.length === 0) {
    content = (
      <>
        <p className="mb-4 text-[13.5px] text-slate-500">Where should we deliver? Use your current location or type the address.</p>
        <AddressForm address={null} isFirst onDone={(saved) => onSelect(saved._id)} />
      </>
    );
  } else {
    content = (
      <>
        <fieldset>
          <legend className="sr-only">Delivery address</legend>
          <div className="flex flex-col gap-3">
            {addresses.map((address) => (
              <AddressOption
                key={address._id}
                address={address}
                name={radioName}
                checked={address._id === selectedId}
                onSelect={onSelect}
                onEdit={setEditing}
              />
            ))}
          </div>
        </fieldset>
        {isFull && (
          <p className="mt-3 text-[12.5px] text-slate-500">
            You&apos;ve saved the maximum of {MAX_ADDRESSES} addresses. Delete one in your profile to add another.
          </p>
        )}
      </>
    );
  }

  return (
    <StepCard
      number={1}
      title="Delivery Address"
      headingId={headingId}
      action={
        addresses.length > 0 && (
          <button
            type="button"
            onClick={() => setEditing(null)}
            disabled={isFull}
            className={`inline-flex h-10 items-center gap-1.5 rounded-full border border-[#d6008a] px-4 text-[13px] font-bold text-[#d6008a] hover:bg-[#fff5fa] hover:text-[#9d0063] disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${FOCUS_RING}`}
          >
            <Plus size={15} aria-hidden="true" />
            Add New Address
          </button>
        )
      }
    >
      {content}
      <AddressFormModal
        open={editing !== undefined}
        address={editing || null}
        isFirst={addresses.length === 0}
        onClose={() => setEditing(undefined)}
        onSaved={(saved) => onSelect(saved._id)}
      />
    </StepCard>
  );
};

export default AddressStep;
