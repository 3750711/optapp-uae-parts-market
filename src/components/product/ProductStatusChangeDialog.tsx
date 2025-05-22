
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

  // Check if a notification was recently sent
  const shouldSendNotification = async (productId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('last_notification_sent_at')
        .eq('id', productId)
        .single();
      
      if (error || !data) {
        console.error('Error fetching notification timestamp:', error);
        return true; // Default to sending if there's an error
      }
      
      if (data.last_notification_sent_at) {
        const lastSent = new Date(data.last_notification_sent_at);
        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
        
        if (lastSent > fiveMinutesAgo) {
          toast.info("Уведомление для этого товара уже было отправлено недавно");
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error checking notification timestamp:', error);
      return true; // Default to sending if there's an error
    }
  };

  const updateNotificationTimestamp = async (productId: string): Promise<void> => {
    try {
      await supabase
        .from('products')
        .update({ last_notification_sent_at: new Date().toISOString() })
        .eq('id', productId);
    } catch (error) {
      console.error('Error updating notification timestamp:', error);
    }
  };

  const sendTelegramNotification = async (productId: string) => {
    try {
      // Check if notification should be sent
      if (!await shouldSendNotification(productId)) {
        return;
      }

      // Update notification timestamp first
      await updateNotificationTimestamp(productId);
      
      // Get a fresh product with all images
      const { data: freshProduct, error: fetchError } = await supabase
        .from('products')
        .select(`*, product_images(*)`)
        .eq('id', productId)
        .single();

      if (fetchError || !freshProduct) {
        throw new Error(fetchError?.message || 'Failed to fetch product details');
      }
      
      // Now call the edge function with the complete product data
      const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
        body: { product: freshProduct }
      });
      
      if (error) {
        console.error('Error calling function:', error);
        throw new Error(error.message);
      }
      
      if (data && data.success) {
        console.log("Notification sent successfully");
        toast.success("Уведомление отправлено в Telegram");
      } else {
        console.error("Notification failed:", data?.message);
        toast.error("Уведомление не было отправлено: " + (data?.message || "Неизвестная ошибка"));
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error("Не удалось отправить уведомление: " + (error instanceof Error ? error.message : String(error)));
    }
  };

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
      
      // Update the product status
      const { data, error } = await supabase
        .from("products")
        .update({ status: "sold" })
        .eq("id", productId)
        .select();

      if (error) throw error;

      toast.success("Статус товара успешно изменен на 'Продано'");
      
      // Send notification about status change if appropriate
      if (data && data.length > 0) {
        await sendTelegramNotification(productId);
      }
      
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
