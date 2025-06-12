
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, User, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SuccessOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: {
    id: string;
    title: string;
    price: number;
    seller_name?: string;
    created_at: string;
  };
}

const SuccessOrderDialog: React.FC<SuccessOrderDialogProps> = ({
  open,
  onOpenChange,
  order
}) => {
  const navigate = useNavigate();

  const handleViewOrders = () => {
    onOpenChange(false);
    navigate('/buyer-orders');
  };

  const handleContinueShopping = () => {
    onOpenChange(false);
    navigate('/catalog');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-xl text-center">
            Заказ успешно создан!
          </DialogTitle>
        </DialogHeader>
        
        {order && (
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-sm text-gray-600">Информация о заказе:</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Номер заказа:</span>
                  <span className="font-medium">#{order.id.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Товар:</span>
                  <span className="font-medium text-right max-w-[60%] break-words">{order.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Цена:</span>
                  <span className="font-medium text-green-700">{order.price} $</span>
                </div>
                {order.seller_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Продавец:</span>
                    <span className="font-medium">{order.seller_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Дата создания:</span>
                  <span className="font-medium">
                    {new Date(order.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Что дальше?</strong> Продавец получит уведомление о вашем заказе и свяжется с вами в ближайшее время.
              </p>
            </div>
          </div>
        )}
        
        <div className="flex flex-col gap-2 pt-4">
          <Button onClick={handleViewOrders} className="w-full">
            Посмотреть мои заказы
          </Button>
          <Button variant="outline" onClick={handleContinueShopping} className="w-full">
            Продолжить покупки
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessOrderDialog;
