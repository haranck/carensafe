import { LogOut } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";
import { useLogout } from "../../hooks/Auth/useLogout";

// "Are you sure?" before logging out (header menu, mobile drawer, profile tab). Controlled: the caller owns `open`.
const LogoutDialog = ({ open, onClose }) => {
  const { logout, isPending } = useLogout();

  return (
    <ConfirmDialog
      open={open}
      title="Log out?"
      description="Are you sure you want to log out?"
      confirmLabel="Log out"
      icon={LogOut}
      isPending={isPending}
      onConfirm={() => logout({ onSettled: onClose })}
      onCancel={onClose}
    />
  );
};

export default LogoutDialog;
