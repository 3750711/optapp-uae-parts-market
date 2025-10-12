import React from 'react';
import { PRODUCTION_DOMAIN } from '@/utils/seoUtils';
import ShareProfileDialog from './ShareProfileDialog';

interface ContactButtonsProps {
  sellerId?: string;
  sellerName?: string;
  className?: string;
  storeInfo?: {
    id?: string;
  } | null;
}

const ContactButtons: React.FC<ContactButtonsProps> = ({
  sellerId,
  sellerName,
  className = "",
  storeInfo
}) => {
  if (!sellerId) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ShareProfileDialog
        sellerId={sellerId}
        sellerName={sellerName || 'My Store'}
        storeInfo={storeInfo}
      />
    </div>
  );
};

export default ContactButtons;