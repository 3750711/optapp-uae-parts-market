
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductStatusChangeDialogProps {
  productId: string;
  productName: string;
  onStatusChange: () => void;
}

const ProductStatusChangeDialog = ({
  productId,
  productName,
  onStatusChange,
}: ProductStatusChangeDialogProps) => {
  const handleMarkAsSold = async () => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ status: "sold" })
        .eq("id", productId);

      if (error) throw error;

      toast.success("Статус товара успешно изменен на 'Продано'");
      onStatusChange();
    } catch (error) {
      toast.error("Ошибка при изменении статуса товара");
      console.error("Error marking product as sold:", error);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Tag className="mr-2 h-4 w-4" />
          Отметить как проданный
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Подтвердите действие</AlertDialogTitle>
          <AlertDialogDescription>
            Вы уверены, что хотите отметить товар "{productName}" как проданный?
            Это действие нельзя отменить.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={handleMarkAsSold}>
            Подтвердить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ProductStatusChangeDialog;
