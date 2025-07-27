
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
      
      // Update the product status - the database trigger will handle the notification automatically
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
      
      console.log(`✅ [ProductStatusChangeDialog] Database update successful - notification will be sent automatically by trigger:`, data);

      // Manually log the action to ensure it's recorded
      try {
        const { error: logError } = await supabase
          .from("event_logs")
          .insert({
            action_type: "update",
            entity_type: "product",
            entity_id: productId,
            user_id: userId,
            details: {
              title: productName,
              old_status: oldStatus,
              new_status: "sold",
              source: "seller_dashboard"
            }
          });
        
        if (logError) {
          console.error("⚠️ [ProductStatusChangeDialog] Error logging action:", logError);
        } else {
          console.log(`📝 [ProductStatusChangeDialog] Action logged successfully`);
        }
      } catch (logException) {
        console.error("⚠️ [ProductStatusChangeDialog] Exception while logging:", logException);
      }

      toast.success("Product status successfully changed to 'Sold'");
      console.log(`🎉 [ProductStatusChangeDialog] Product status change completed successfully`);
      
      onStatusChange();
    } catch (error) {
      console.error("❌ [ProductStatusChangeDialog] Error in handleMarkAsSold:", error);
      toast.error("Error changing product status");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="h-10 px-2 text-xs min-w-0 flex-shrink-0 whitespace-nowrap touch-manipulation">
          <Tag className="mr-1 h-3 w-3" />
          <span className="hidden sm:inline">Mark Sold</span>
          <span className="sm:hidden">Sold</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Action</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to mark "{productName}" as sold?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleMarkAsSold}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ProductStatusChangeDialog;
