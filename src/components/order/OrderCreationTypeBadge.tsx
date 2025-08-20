import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, FileText, Crown, Store } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";

interface OrderCreationTypeBadgeProps {
  orderCreatedType: 'free_order' | 'product_order' | 'ads_order' | 'price_offer_order';
  sellerUserType?: string | null;
  className?: string;
}

export const OrderCreationTypeBadge: React.FC<OrderCreationTypeBadgeProps> = ({
  orderCreatedType,
  sellerUserType,
  className = ""
}) => {
  const { isAdmin } = useAuth();
  
  // Only show badges to administrators
  if (!isAdmin) {
    return null;
  }
  const getCreationTypeBadge = () => {
    switch (orderCreatedType) {
      case 'product_order':
      case 'ads_order':
        return {
          icon: <ShoppingCart className="w-3 h-3 mr-1" />,
          label: 'Через товар',
          className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
        };
      case 'price_offer_order':
        return {
          icon: <ShoppingCart className="w-3 h-3 mr-1" />,
          label: 'Через предложение',
          className: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
        };
      case 'free_order':
      default:
        return {
          icon: <FileText className="w-3 h-3 mr-1" />,
          label: 'Свободный',
          className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
        };
    }
  };

  const getCreatorBadge = () => {
    if (sellerUserType === 'admin') {
      return {
        icon: <Crown className="w-3 h-3 mr-1" />,
        label: 'Админ',
        className: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
      };
    } else {
      return {
        icon: <Store className="w-3 h-3 mr-1" />,
        label: 'Продавец',
        className: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
      };
    }
  };

  const creationType = getCreationTypeBadge();
  const creator = getCreatorBadge();

  return (
    <div className={`flex gap-1 ${className}`}>
      <Badge 
        variant="outline" 
        className={`text-xs flex items-center ${creationType.className}`}
      >
        {creationType.icon}
        {creationType.label}
      </Badge>
      <Badge 
        variant="outline" 
        className={`text-xs flex items-center ${creator.className}`}
      >
        {creator.icon}
        {creator.label}
      </Badge>
    </div>
  );
};