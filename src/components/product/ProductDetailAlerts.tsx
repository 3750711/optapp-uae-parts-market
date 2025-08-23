
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Product } from "@/types/product";
import { useLanguage } from '@/hooks/useLanguage';
import { getSellerPagesTranslations } from '@/utils/translations/sellerPages';

interface ProductDetailAlertsProps {
  product: Product;
  isOwner: boolean;
  isAdmin: boolean;
}

const ProductDetailAlerts: React.FC<ProductDetailAlertsProps> = ({
  product,
  isOwner,
  isAdmin,
}) => {
  const { language } = useLanguage();
  const sp = getSellerPagesTranslations(language);
  
  if (product.status === 'pending' && (isOwner || isAdmin)) {
    return (
      <Alert className="mb-6 bg-yellow-50 border-yellow-200 animate-fade-in">
        <AlertTitle className="text-yellow-800">{sp.moderationAlert.pendingTitle}</AlertTitle>
        <AlertDescription className="text-yellow-700">
          {sp.moderationAlert.pendingDescription} {isOwner ? sp.moderationAlert.pendingDescriptionOwner : sp.moderationAlert.pendingDescriptionAdmin}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (product.status === 'archived' && (isOwner || isAdmin)) {
    return (
      <Alert className="mb-6 bg-gray-50 border-gray-200 animate-fade-in">
        <AlertTitle className="text-gray-800">{sp.moderationAlert.archivedTitle}</AlertTitle>
        <AlertDescription className="text-gray-600">
          {sp.moderationAlert.archivedDescription} {isOwner ? sp.moderationAlert.archivedDescriptionOwner : sp.moderationAlert.archivedDescriptionAdmin}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default ProductDetailAlerts;
