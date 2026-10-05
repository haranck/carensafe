import { useState } from "react";
import { Mail, ShieldCheck } from "lucide-react";
import ProfileHeading from "../../components/Profile/ProfileHeading";
import Panel from "../../components/Profile/Panel";
import PanelSkeleton from "../../components/Profile/PanelSkeleton";
import AvatarUploader from "../../components/Profile/AvatarUploader";
import ProfileForm from "../../components/Profile/ProfileForm";
import ChangeEmailModal from "../../components/Profile/ChangeEmailModal";
import SectionError from "../../components/Home/SectionError";
import { useGetProfile } from "../../hooks/Profile/ProfileHooks";
import { FOCUS_RING } from "../../constants/customerTheme";
import { usePageTitle } from "../../hooks/common/usePageTitle";

const ProfileEditPage = () => {
  usePageTitle("Edit Profile");
  const { data, isLoading, isError, isFetching, refetch } = useGetProfile();
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const profile = data?.data;

  let content;
  if (isLoading) {
    content = (
      <div className="flex flex-col gap-4">
        <PanelSkeleton lines={2} />
        <PanelSkeleton lines={4} />
      </div>
    );
  } else if (isError || !profile) {
    content = <SectionError message="We couldn't load your profile." onRetry={refetch} isRetrying={isFetching} />;
  } else {
    content = (
      <div className="flex flex-col gap-4">
        <Panel>
          <AvatarUploader user={profile} />
        </Panel>

        <Panel title="Personal details">
          <ProfileForm profile={profile} />
        </Panel>

        <Panel title="Email">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex min-w-0 items-center gap-2 text-[14px] font-semibold text-[#1e1a3a]">
              <Mail size={17} aria-hidden="true" className="flex-shrink-0 text-[#d6008a]" />
              <span className="truncate">{profile.email}</span>
            </p>
            {profile.canChangeEmail && (
              <button
                type="button"
                onClick={() => setIsEmailOpen(true)}
                className={`inline-flex h-10 items-center rounded-full border border-pink-200 px-5 text-[13px] font-bold text-[#d6008a] hover:bg-[#fff5fa] hover:text-[#9d0063] transition-colors ${FOCUS_RING}`}
              >
                Change
              </button>
            )}
          </div>
          {!profile.canChangeEmail && (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-[12.5px] text-slate-500">
              <ShieldCheck size={15} aria-hidden="true" className="mt-px flex-shrink-0" />
              You sign in with Google, so your email is managed by your Google account.
            </p>
          )}
        </Panel>

        <ChangeEmailModal open={isEmailOpen} currentEmail={profile.email} onClose={() => setIsEmailOpen(false)} />
      </div>
    );
  }

  return (
    <>
      <ProfileHeading accent="Profile" description="Your personal details and login email." />
      {content}
    </>
  );
};

export default ProfileEditPage;
