
import React, { useState } from "react";
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
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMarkAsSold = async () => {
    try {
      setIsProcessing(true);
      
      // Get the current user for logging
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      if (!userId) {
        toast.error("Не удалось получить информацию о пользователе");
        return;
      }
      
      // Manually log the action to ensure it's recorded
      const { error: logError } = await supabase
        .from("action_logs")
        .insert({
          action_type: "update",
          entity_type: "product",
          entity_id: productId,
          user_id: userId,
          details: {
            title: productName,
            old_status: "active", // Assuming it was active before
            new_status: "sold",
          }
        });
      
      if (logError) {
        console.error("Error logging product status change:", logError);
      }
      
      // Update the product status - the database trigger will handle the notification
      const { data, error } = await supabase
        .from("products")
        .update({ status: "sold" })
        .eq("id", productId)
        .select();

      if (error) throw error;

      toast.success("Статус товара успешно изменен на 'Продано'");
      
      onStatusChange();
    } catch (error) {
      toast.error("Ошибка при изменении статуса товара");
      console.error("Error marking product as sold:", error);
    } finally {
      setIsProcessing(false);
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
          <AlertDialogAction 
            onClick={handleMarkAsSold}
            disabled={isProcessing}
          >
            {isProcessing ? "Обработка..." : "Подтвердить"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ProductStatusChangeDialog;
