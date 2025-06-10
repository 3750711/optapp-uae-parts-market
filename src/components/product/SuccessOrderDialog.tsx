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
import EnhancedSuccessOrderDialog from "./EnhancedSuccessOrderDialog";

interface SuccessOrderDialogProps {
  open: boolean;
  onClose: () => void;
  orderNumber: number;
  // Новые опциональные props для расширенной функциональности
  orderInfo?: {
    orderNumber: number;
    title: string;
    brand?: string;
    model?: string;
    price: number;
    deliveryMethod: string;
  };
  sellerInfo?: {
    name: string;
    optId?: string;
    telegram?: string;
  };
  enhanced?: boolean;
}

const SuccessOrderDialog = ({ 
  open, 
  onClose, 
  orderNumber, 
  orderInfo,
  sellerInfo,
  enhanced = false 
}: SuccessOrderDialogProps) => {
  console.log('📞 SuccessOrderDialog render:', { open, orderNumber, enhanced });

  const handleClose = () => {
    console.log('✖️ SuccessOrderDialog close button clicked');
    onClose();
  };

  const handleOpenChange = (isOpen: boolean) => {
    console.log('🔄 SuccessOrderDialog onOpenChange:', isOpen);
    if (!isOpen) {
      onClose();
    }
  };

  // Если передана расширенная информация, используем новый компонент
  if (enhanced && orderInfo && sellerInfo) {
    return (
      <EnhancedSuccessOrderDialog
        open={open}
        onClose={onClose}
        orderInfo={orderInfo}
        sellerInfo={sellerInfo}
      />
    );
  }

  // Оригинальный простой диалог для обратной совместимости
  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl text-center mb-4">
            Заказ успешно создан!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-center space-y-2">
            <p className="font-semibold text-lg text-black">
              Номер заказа: {orderNumber}
            </p>
            <p>Скоро продавец с вами свяжется.</p>
            <p className="text-optapp-yellow font-medium">
              Спасибо за заказ и спасибо что выбрали OPTAPP!
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6">
          <Button 
            onClick={handleClose}
            className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
          >
            Все понял
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SuccessOrderDialog;
