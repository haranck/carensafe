import { Briefcase, Home, MapPin, Pencil, Phone, Star, Trash2 } from "lucide-react";
import { FOCUS_RING } from "../../constants/customerTheme";
import { formatAddress } from "../../utils/address";

const TYPE_ICONS = { Home, Work: Briefcase, Other: MapPin };

const ACTION = `inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition-colors ${FOCUS_RING}`;

const AddressCard = ({ address, onEdit, onDelete, onSetDefault, compact = false }) => {
  const TypeIcon = TYPE_ICONS[address.type] || MapPin;

  return (
    <article
      className={`flex h-full flex-col rounded-2xl border bg-white p-4 sm:p-5 ${address.isDefault ? "border-pink-200 shadow-[0_8px_24px_-14px_rgba(214,0,138,0.35)]" : "border-slate-100"}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-0.5 text-[11.5px] font-bold text-[#3b2a8a]">
          <TypeIcon size={13} aria-hidden="true" />
          {address.type}
        </span>
        {address.isDefault && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fff5fa] px-2.5 py-0.5 text-[11.5px] font-bold text-[#d6008a]">
            <Star size={12} aria-hidden="true" className="fill-current" />
            Default
          </span>
        )}
      </div>

      <p className="mt-3 text-[14.5px] font-bold text-[#1e1a3a]">{address.fullName}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-slate-500">
        <Phone size={13} aria-hidden="true" />
        {address.phone}
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{formatAddress(address)}</p>

      {!compact && (
        <div className="mt-auto flex flex-wrap items-center gap-1 pt-4 -ml-3">
          <button type="button" onClick={() => onEdit(address)} className={`${ACTION} text-slate-600 hover:bg-slate-50 hover:text-[#1e1a3a]`}>
            <Pencil size={14} aria-hidden="true" />
            Edit
          </button>
          <button type="button" onClick={() => onDelete(address)} className={`${ACTION} text-slate-600 hover:bg-rose-50 hover:text-rose-600`}>
            <Trash2 size={14} aria-hidden="true" />
            Delete
          </button>
          {!address.isDefault && (
            <button type="button" onClick={() => onSetDefault(address)} className={`${ACTION} text-[#d6008a] hover:bg-[#fff5fa] hover:text-[#9d0063]`}>
              <Star size={14} aria-hidden="true" />
              Set as default
            </button>
          )}
        </div>
      )}
    </article>
  );
};

export default AddressCard;
