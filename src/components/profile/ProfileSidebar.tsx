
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
    <div className="w-full space-y-6">
      <ProfileHeader 
        profile={profile} 
        onAvatarUpdate={onAvatarUpdate}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
        <ProfileActions 
          profile={profile}
          isLoading={isLoading}
        />
        <ProfileInfo profile={profile} />
      </div>
    </div>
  );
};

export default ProfileSidebar;
