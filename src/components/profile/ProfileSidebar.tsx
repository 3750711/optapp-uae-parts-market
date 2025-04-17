
import React from "react";
import ProfileHeader from "./ProfileHeader";
import ProfileActions from "./ProfileActions";
import ProfileInfo from "./ProfileInfo";
import { ProfileType } from "./types";

interface ProfileSidebarProps {
  profile: ProfileType;
  isLoading: boolean;
  // Removed onDeleteAccount and onContactAdmin
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  profile,
  isLoading,
}) => {
  return (
    <div className="w-full md:w-1/3 space-y-6">
      <ProfileHeader profile={profile} />
      <ProfileActions 
        profile={profile}
        isLoading={isLoading}
        // Removed onDeleteAccount and onContactAdmin props
      />
      <ProfileInfo profile={profile} />
    </div>
  );
};

export default ProfileSidebar;
