import React from 'react';
import { PRODUCTION_DOMAIN } from '@/utils/seoUtils';
import ShareProfileDialog from './ShareProfileDialog';

interface ContactButtonsProps {
  sellerId?: string;
  sellerName?: string;
  className?: string;
  storeInfo?: {
    id?: string;
    public_share_token?: string;
    public_share_enabled?: boolean;
  } | null;
  profileInfo?: {
    public_share_token?: string;
    public_share_enabled?: boolean;
  } | null;
}

const ContactButtons: React.FC<ContactButtonsProps> = ({
  sellerId,
  sellerName,
  className = "",
  storeInfo,
  profileInfo
}) => {
  if (!sellerId) {
    return null;
  }

  // Check if we have either store or profile sharing enabled
  const hasStoreShare = storeInfo?.public_share_token && storeInfo?.public_share_enabled;
  const hasProfileShare = profileInfo?.public_share_token && profileInfo?.public_share_enabled;
  const hasAnyShare = hasStoreShare || hasProfileShare;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {hasAnyShare && (
        <ShareProfileDialog
          sellerId={sellerId}
          sellerName={sellerName || 'My Store'}
          storeInfo={storeInfo}
          profileInfo={profileInfo}
        />
      )}
    </div>
  );
};

export default ContactButtons;