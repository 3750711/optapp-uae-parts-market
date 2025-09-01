import React from 'react';
import { Check, X, MessageSquare, Package } from 'lucide-react';

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
  return (
    <div className={`flex items-center gap-3 text-sm ${className}`}>
      <div className="flex items-center gap-1">
        <MessageSquare className="h-3 w-3 text-muted-foreground" />
        {hasChatScreenshots ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <X className="h-4 w-4 text-red-600" />
        )}
        <span className={hasChatScreenshots ? "text-green-600" : "text-red-600"}>
          Screen
        </span>
      </div>
      
      <div className="flex items-center gap-1">
        <Package className="h-3 w-3 text-muted-foreground" />
        {hasSignedProduct ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <X className="h-4 w-4 text-red-600" />
        )}
        <span className={hasSignedProduct ? "text-green-600" : "text-red-600"}>
          Photos
        </span>
      </div>
    </div>
  );
};