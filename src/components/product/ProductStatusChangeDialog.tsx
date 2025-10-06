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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { getProductStatusTranslations } from "@/utils/translations/productStatuses";
import { useTelegramNotification } from "@/hooks/useTelegramNotification";


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
  const { language } = useLanguage();
  const t = getProductStatusTranslations(language);
  const { sendProductNotification } = useTelegramNotification();
  

  const handleMarkAsSold = async () => {
    try {
      setIsProcessing(true);
      console.log(`🔄 [ProductStatusChangeDialog] Starting product status change to 'sold' for product: ${productId}`);
      
      // Get the current user for logging
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      if (!userId) {
        console.error("❌ [ProductStatusChangeDialog] No user ID found");
        toast.error("Unable to get user information");
        return;
      }
      
      console.log(`👤 [ProductStatusChangeDialog] User ID: ${userId}`);
      
      // Get current product status before update
      const { data: currentProduct } = await supabase
        .from("products")
        .select("status")
        .eq("id", productId)
        .single();
      
      const oldStatus = currentProduct?.status || "unknown";
      console.log(`📊 [ProductStatusChangeDialog] Current status: ${oldStatus} -> sold`);
      
      // Update the product status
      console.log(`💾 [ProductStatusChangeDialog] Updating product status in database...`);
      const { data, error } = await supabase
        .from("products")
        .update({ status: "sold" })
        .eq("id", productId)
        .select();

      if (error) {
        console.error("❌ [ProductStatusChangeDialog] Database update failed:", error);
        throw error;
      }
      
      console.log(`✅ [ProductStatusChangeDialog] Database update successful:`, data);
      
      // Send Telegram notification
      console.log(`📢 [ProductStatusChangeDialog] Sending 'sold' notification...`);
      await sendProductNotification(productId, 'sold');

      // Логирование отключено - используется Microsoft Clarity

      toast.success(t.markSoldDialog.successMessage);
      console.log(`🎉 [ProductStatusChangeDialog] Product status change completed successfully`);
      
      onStatusChange();
    } catch (error) {
      console.error("❌ [ProductStatusChangeDialog] Error in handleMarkAsSold:", error);
      toast.error(t.markSoldDialog.errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="inline-flex h-8 min-w-0 flex-1 items-center justify-center rounded-lg px-3 text-sm font-medium">
          {t.actions.markSoldShort}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.markSoldDialog.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.markSoldDialog.description.replace('{productName}', `"${productName}"`)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.markSoldDialog.cancel}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleMarkAsSold}
            disabled={isProcessing}
          >
            {isProcessing ? t.markSoldDialog.processing : t.markSoldDialog.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ProductStatusChangeDialog;
