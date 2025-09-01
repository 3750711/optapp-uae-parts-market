import React from 'react';
import { Check, X } from 'lucide-react';
import { getSellerOrdersTranslations } from '@/utils/translations/sellerOrders';
import { useLanguage } from '@/hooks/useLanguage';

interface PhotoConfirmationStatusProps {
  hasChatScreenshots: boolean;
  hasSignedProduct: boolean;
  className?: string;
}

export const PhotoConfirmationStatus = ({ 
  hasChatScreenshots, 
  hasSignedProduct, 
  className = "" 
}: PhotoConfirmationStatusProps) => {
  const { language } = useLanguage();
  const t = getSellerOrdersTranslations(language);

  return (
    <div className={`flex items-center gap-3 text-sm ${className}`}>
      <div className="flex items-center gap-1">
        {hasChatScreenshots ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <X className="h-4 w-4 text-red-600" />
        )}
        <span className={hasChatScreenshots ? "text-green-600" : "text-red-600"}>
          {t.screenStatus}
        </span>
      </div>
      
      <div className="flex items-center gap-1">
        {hasSignedProduct ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <X className="h-4 w-4 text-red-600" />
        )}
        <span className={hasSignedProduct ? "text-green-600" : "text-red-600"}>
          {t.photosStatus}
        </span>
      </div>
    </div>
  );
};