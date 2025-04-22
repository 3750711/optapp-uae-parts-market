
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

interface SuccessOrderDialogProps {
  open: boolean;
  onClose: () => void;
  orderNumber: number;
}

const SuccessOrderDialog = ({ open, onClose, orderNumber }: SuccessOrderDialogProps) => {
  return (
    <AlertDialog open={open}>
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
            onClick={onClose}
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
