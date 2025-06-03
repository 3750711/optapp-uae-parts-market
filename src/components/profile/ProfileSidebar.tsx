
import React from "react";
import ProfileHeader from "./ProfileHeader";
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
    <div className="w-full space-y-6">
      <ProfileHeader 
        profile={profile} 
        onAvatarUpdate={onAvatarUpdate}
      />
      <ProfileInfo profile={profile} />
    </div>
  );
};

export default ProfileSidebar;
