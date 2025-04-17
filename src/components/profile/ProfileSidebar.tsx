
import React from "react";
import ProfileHeader from "./ProfileHeader";
import ProfileActions from "./ProfileActions";
import ProfileInfo from "./ProfileInfo";
import { ProfileType } from "./types";

interface ProfileSidebarProps {
  profile: ProfileType;
  isLoading: boolean;
  onAvatarUpdate: (avatarUrl: string) => Promise<void>;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  profile,
  isLoading,
  onAvatarUpdate,
}) => {
  return (
    <div className="w-full md:w-1/3 space-y-6">
      <ProfileHeader 
        profile={profile} 
        onAvatarUpdate={onAvatarUpdate}
      />
      <ProfileActions 
        profile={profile}
        isLoading={isLoading}
      />
      <ProfileInfo profile={profile} />
    </div>
  );
};

export default ProfileSidebar;
