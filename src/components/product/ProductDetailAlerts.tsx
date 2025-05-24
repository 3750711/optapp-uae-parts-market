
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Product } from "@/types/product";

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
  if (product.status === 'pending' && (isOwner || isAdmin)) {
    return (
      <Alert className="mb-6 bg-yellow-50 border-yellow-200 animate-fade-in">
        <AlertTitle className="text-yellow-800">Объявление на проверке</AlertTitle>
        <AlertDescription className="text-yellow-700">
          Это объявление ожидает проверки модераторами. {isOwner ? 'Только вы и администраторы могут его видеть.' : 'Как администратор, вы можете видеть это объявление.'}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (product.status === 'archived' && (isOwner || isAdmin)) {
    return (
      <Alert className="mb-6 bg-gray-50 border-gray-200 animate-fade-in">
        <AlertTitle className="text-gray-800">Объявление в архиве</AlertTitle>
        <AlertDescription className="text-gray-600">
          Это объявление находится в архиве. {isOwner ? 'Только вы и администраторы могут его видеть.' : 'Как администратор, вы можете видеть это объявление.'}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default ProductDetailAlerts;
