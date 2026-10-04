import { useEffect, useId, useState } from "react";
import toast from "react-hot-toast";
import { AlertCircle, Camera, Loader2 } from "lucide-react";
import UserAvatar from "../common/UserAvatar";
import { useUploadAvatar } from "../../hooks/Profile/ProfileHooks";
import { ERROR_TEXT, getErrorMessage } from "../../utils/errorMessage";

// Same limits as the upload middleware
const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Photo with a camera button: checks type / size here first, shows the picked image while it uploads
const AvatarUploader = ({ user }) => {
  const inputId = useId();
  const [preview, setPreview] = useState(null);
  const [fileError, setFileError] = useState("");
  const { mutate, isPending } = useUploadAvatar();

  // Free the local preview URL when it's replaced or cleared
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError("Choose a JPG, PNG or WEBP image.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setFileError("The image must be 5 MB or smaller.");
      return;
    }

    setFileError("");
    setPreview(URL.createObjectURL(file));
    mutate(file, {
      onSuccess: () => toast.success("Profile photo updated", { id: "avatar-updated" }),
      onError: (error) => toast.error(getErrorMessage(error, ERROR_TEXT.UPLOAD), { id: "avatar-error" }),
      onSettled: () => setPreview(null),
    });
  };

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
      <div className="relative">
        {preview ? (
          <img src={preview} alt="" className="h-24 w-24 rounded-full object-cover" />
        ) : (
          <UserAvatar user={user} className="h-24 w-24 text-[28px]" />
        )}
        {isPending && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-[#1e1a3a]/45">
            <Loader2 size={26} aria-hidden="true" className="animate-spin text-white" />
          </span>
        )}
        <input
          id={inputId}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={handleFile}
          disabled={isPending}
          className="peer sr-only"
        />
        <label
          htmlFor={inputId}
          title="Change photo"
          className="absolute -bottom-1 -right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-gradient-to-r from-[#d6008a] to-[#9d0063] text-white shadow-md hover:brightness-110 peer-disabled:cursor-wait peer-disabled:opacity-70 peer-focus-visible:ring-2 peer-focus-visible:ring-[#d6008a]/40 peer-focus-visible:ring-offset-2"
        >
          <Camera size={17} aria-hidden="true" />
          <span className="sr-only">Change profile photo</span>
        </label>
      </div>
      <div className="text-center sm:text-left">
        <p className="text-[14px] font-bold text-[#1e1a3a]">Profile photo</p>
        <p className="text-[12.5px] text-slate-500">JPG, PNG or WEBP, up to 5 MB.</p>
        {isPending && <p className="mt-1 text-[12.5px] font-semibold text-[#d6008a]">Uploading…</p>}
        {fileError && (
          <p role="alert" className="mt-1 flex items-center justify-center gap-1 text-[12.5px] font-semibold text-rose-500 sm:justify-start">
            <AlertCircle size={13} aria-hidden="true" />
            {fileError}
          </p>
        )}
      </div>
    </div>
  );
};

export default AvatarUploader;
