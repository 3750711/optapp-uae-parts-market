
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
        toast.error("Unable to get user information");
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

      // Fallback: Direct call to Edge Function for Telegram notification
      try {
        await supabase.functions.invoke('send-telegram-notification', {
          body: {
            action: 'status_change',
            productId: productId,
            type: 'product'
          }
        });
        console.log('Fallback Telegram notification sent successfully');
      } catch (notificationError) {
        console.error('Fallback notification failed:', notificationError);
        // Don't throw here - product update was successful
      }

      toast.success("Product status successfully changed to 'Sold'");
      
      onStatusChange();
    } catch (error) {
      toast.error("Error changing product status");
      console.error("Error marking product as sold:", error);
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
