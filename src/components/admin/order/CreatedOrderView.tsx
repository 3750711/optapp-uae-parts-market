
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { OrderConfirmationCard } from "@/components/order/OrderConfirmationCard";
import { CreatedOrderProps } from "./types";

export const CreatedOrderView: React.FC<CreatedOrderProps> = ({ 
  order, 
  images, 
  onBack, 
  onNewOrder, 
  onOrderUpdate 
}) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-end">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="mr-4"
        >
          Вернуться в панель
        </Button>
        <Button onClick={onNewOrder}>
          Создать новый заказ
        </Button>
      </div>
      <OrderConfirmationCard 
        order={order} 
        images={images}
        onOrderUpdate={onOrderUpdate}
      />
    </div>
  );
};
