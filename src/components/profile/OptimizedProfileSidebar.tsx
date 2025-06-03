
import React, { memo } from "react";
import OptimizedProfileHeader from "./OptimizedProfileHeader";
import ProfileInfo from "./ProfileInfo";
import { ProfileType } from "./types";

interface OptimizedProfileSidebarProps {
  profile: ProfileType;
  isLoading: boolean;
  onAvatarUpdate: (avatarUrl: string) => Promise<void>;
}

const OptimizedProfileSidebar: React.FC<OptimizedProfileSidebarProps> = memo(({
  profile,
  isLoading,
  onAvatarUpdate,
}) => {
  return (
    <div className="w-full space-y-6">
      <OptimizedProfileHeader 
        profile={profile} 
        onAvatarUpdate={onAvatarUpdate}
        isLoading={isLoading}
      />
      <ProfileInfo profile={profile} />
    </div>
  );
});

OptimizedProfileSidebar.displayName = "OptimizedProfileSidebar";

export default OptimizedProfileSidebar;
