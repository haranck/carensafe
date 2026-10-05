import { useState } from "react";
import toast from "react-hot-toast";
import { MapPin, Plus, Trash2 } from "lucide-react";
import ProfileHeading from "../../components/Profile/ProfileHeading";
import PanelSkeleton from "../../components/Profile/PanelSkeleton";
import AddressCard from "../../components/Profile/AddressCard";
import AddressFormModal from "../../components/Profile/AddressFormModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import SectionError from "../../components/Home/SectionError";
import { useDeleteAddress, useGetAddresses, useSetDefaultAddress } from "../../hooks/Address/AddressHooks";
import { BRAND_GRADIENT, FOCUS_RING, PINK_BUTTON } from "../../constants/customerTheme";
import { usePageTitle } from "../../hooks/common/usePageTitle";

// Same limit as the API (config/addresses.js)
const MAX_ADDRESSES = 10;

const ProfileAddressesPage = () => {
  usePageTitle("My Addresses");
  const { data, isLoading, isError, isFetching, refetch } = useGetAddresses();
  const { mutate: deleteAddress, isPending: isDeleting } = useDeleteAddress();
  const { mutate: setDefault } = useSetDefaultAddress();
  // undefined = closed, null = add, address = edit
  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(null);

  const addresses = data?.data || [];
  const isFull = addresses.length >= MAX_ADDRESSES;

  const handleDelete = () => {
    deleteAddress(deleting._id, {
      onSuccess: () => toast.success("Address deleted", { id: "address-deleted" }),
      onSettled: () => setDeleting(null),
    });
  };

  const handleSetDefault = (address) => {
    setDefault(address._id, {
      onSuccess: () => toast.success("Default address updated", { id: "address-default" }),
    });
  };

  const addButton = (
    <button
      type="button"
      onClick={() => setEditing(null)}
      disabled={isFull || isLoading}
      className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-[14px] font-bold text-white ${BRAND_GRADIENT} shadow-[0_6px_18px_rgba(124,58,237,0.28)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${FOCUS_RING}`}
    >
      <Plus size={17} aria-hidden="true" />
      Add New Address
    </button>
  );

  let content;
  if (isLoading) {
    content = (
      <div className="grid gap-4 md:grid-cols-2">
        <PanelSkeleton lines={3} />
        <PanelSkeleton lines={3} />
      </div>
    );
  } else if (isError) {
    content = <SectionError message="We couldn't load your addresses." onRetry={refetch} isRetrying={isFetching} />;
  } else if (addresses.length === 0) {
    content = (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-pink-200 bg-white px-6 py-14 text-center">
        <span className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-[#fff5fa]">
          <MapPin size={38} strokeWidth={1.6} aria-hidden="true" className="text-pink-300" />
        </span>
        <p className="text-[17px] font-extrabold text-[#1e1a3a]">No saved addresses</p>
        <p className="text-[13.5px] text-slate-500">Add an address for faster checkout.</p>
        <button
          type="button"
          onClick={() => setEditing(null)}
          className={`mt-3 inline-flex h-11 items-center gap-2 rounded-full px-6 text-[14px] font-bold ${PINK_BUTTON} ${FOCUS_RING}`}
        >
          <Plus size={16} aria-hidden="true" />
          Add Address
        </button>
      </div>
    );
  } else {
    content = (
      <>
        <ul className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <li key={address._id}>
              <AddressCard address={address} onEdit={setEditing} onDelete={setDeleting} onSetDefault={handleSetDefault} />
            </li>
          ))}
        </ul>
        {isFull && (
          <p className="mt-4 text-[12.5px] text-slate-500">
            You&apos;ve saved the maximum of {MAX_ADDRESSES} addresses. Delete one to add another.
          </p>
        )}
      </>
    );
  }

  return (
    <>
      <ProfileHeading
        accent="Addresses"
        description="Where we deliver your orders."
        action={addresses.length > 0 ? addButton : null}
      />
      {content}

      <AddressFormModal
        open={editing !== undefined}
        address={editing || null}
        isFirst={addresses.length === 0}
        onClose={() => setEditing(undefined)}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this address?"
        description={
          deleting?.isDefault
            ? "This is your default address. Your most recently updated address will become the default."
            : "This address will be removed from your account."
        }
        confirmLabel="Delete"
        icon={Trash2}
        isPending={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
};

export default ProfileAddressesPage;
