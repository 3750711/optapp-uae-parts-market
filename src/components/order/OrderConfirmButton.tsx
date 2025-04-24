
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { OrderConfirmationImages } from "@/components/order/OrderConfirmationImages";

interface OrderConfirmButtonProps {
  orderId: string;
}

export const OrderConfirmButton: React.FC<OrderConfirmButtonProps> = ({ orderId }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="outline"
        className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 gap-2"
      >
        <Upload className="h-4 w-4" />
        Прикрепить фото с подписью
      </Button>
      
      {isExpanded && (
        <OrderConfirmationImages orderId={orderId} canEdit={true} />
      )}
    </div>
  );
};
