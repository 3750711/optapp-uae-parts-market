
import React from "react";
import ProfileHeader from "./ProfileHeader";
import ProfileActions from "./ProfileActions";
import ProfileInfo from "./ProfileInfo";
import { ProfileType } from "@/integrations/supabase/types";

interface ProfileSidebarProps {
  profile: ProfileType;
  isLoading: boolean;
  onDeleteAccount: () => Promise<void>;
  onContactAdmin: () => void;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  profile,
  isLoading,
  onDeleteAccount,
  onContactAdmin,
}) => {
  return (
    <div className="w-full md:w-1/3 space-y-6">
      <ProfileHeader profile={profile} />
      <ProfileActions 
        profile={profile}
        isLoading={isLoading}
        onDeleteAccount={onDeleteAccount}
        onContactAdmin={onContactAdmin}
      />
      <ProfileInfo profile={profile} />
    </div>
  );
};

export default ProfileSidebar;
