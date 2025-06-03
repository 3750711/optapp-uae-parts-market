
import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Package, User, Truck, ArrowRight, MessageCircle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OrderInfo {
  orderNumber: number;
  title: string;
  brand?: string;
  model?: string;
  price: number;
  deliveryMethod: string;
}

interface SellerInfo {
  name: string;
  optId?: string;
  telegram?: string;
}

interface EnhancedSuccessOrderDialogProps {
  open: boolean;
  onClose: () => void;
  orderInfo: OrderInfo;
  sellerInfo: SellerInfo;
}

const EnhancedSuccessOrderDialog = ({ 
  open, 
  onClose, 
  orderInfo, 
  sellerInfo 
}: EnhancedSuccessOrderDialogProps) => {
  const navigate = useNavigate();

  const handleViewOrders = () => {
    navigate('/buyer/orders');
    onClose();
  };

  const handleBackToCatalog = () => {
    navigate('/catalog');
    onClose();
  };

  const handleContactSeller = () => {
    if (sellerInfo.telegram) {
      window.open(sellerInfo.telegram, '_blank');
    }
  };

  const getDeliveryMethodText = (method: string) => {
    switch (method) {
      case 'cargo_rf': return 'Доставка Cargo РФ';
      case 'cargo_kz': return 'Доставка Cargo KZ';
      case 'self_pickup': return 'Самовывоз';
      default: return method;
    }
  };

  const nextSteps = [
    { 
      step: 1, 
      title: "Продавец получил уведомление", 
      description: "Продавец уже знает о вашем заказе",
      completed: true 
    },
    { 
      step: 2, 
      title: "Связь с продавцом", 
      description: "Продавец свяжется с вами в течение 24 часов",
      completed: false 
    },
    { 
      step: 3, 
      title: "Обсуждение деталей", 
      description: "Уточните детали заказа и способ доставки",
      completed: false 
    },
    { 
      step: 4, 
      title: "Получение товара", 
      description: "Получите товар согласно договоренности",
      completed: false 
    }
  ];

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-scale-in">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <AlertDialogTitle className="text-2xl font-bold text-green-700">
            Заказ успешно создан!
          </AlertDialogTitle>
          
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-lg font-semibold text-green-800">
              Номер заказа: #{orderInfo.orderNumber}
            </p>
          </div>
        </AlertDialogHeader>

        <div className="space-y-6 mt-6">
          {/* Информация о заказе */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Информация о заказе
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Товар:</span>
                <span className="font-medium text-right max-w-[60%]">
                  {orderInfo.title}
                </span>
              </div>
              
              {orderInfo.brand && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Бренд:</span>
                  <span className="font-medium">{orderInfo.brand}</span>
                </div>
              )}
              
              {orderInfo.model && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Модель:</span>
                  <span className="font-medium">{orderInfo.model}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Цена:</span>
                <span className="font-semibold text-green-600">${orderInfo.price}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Доставка:</span>
                <span className="font-medium">{getDeliveryMethodText(orderInfo.deliveryMethod)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Информация о продавце */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              Информация о продавце
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Продавец:</span>
                <span className="font-medium">{sellerInfo.name}</span>
              </div>
              
              {sellerInfo.optId && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">OPT ID:</span>
                  <span className="font-medium">{sellerInfo.optId}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Что дальше? */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-600" />
              Что дальше?
            </h3>
            
            <div className="space-y-3">
              {nextSteps.map((step, index) => (
                <div key={step.step} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.completed 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {step.completed ? <CheckCircle className="w-4 h-4" /> : step.step}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${step.completed ? 'text-green-700' : 'text-gray-900'}`}>
                      {step.title}
                    </p>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Благодарность */}
          <div className="text-center bg-optapp-yellow/10 rounded-lg p-4">
            <p className="text-optapp-dark font-medium">
              Спасибо за заказ и спасибо что выбрали OPTAPP!
            </p>
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-3 mt-6">
          {/* Дополнительные действия */}
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={handleViewOrders}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Мои заказы
            </Button>
            
            {sellerInfo.telegram && (
              <Button 
                variant="outline" 
                onClick={handleContactSeller}
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Связаться
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={handleBackToCatalog}
              className="flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              В каталог
            </Button>
          </div>
          
          {/* Основная кнопка */}
          <Button 
            onClick={onClose}
            className="w-full sm:w-auto bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
          >
            Все понял
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EnhancedSuccessOrderDialog;
