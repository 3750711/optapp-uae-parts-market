import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Check, AlertTriangle, MessageSquare, Package } from "lucide-react";
import { OrderConfirmImagesDialog } from "@/components/order/OrderConfirmImagesDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSellerOrdersTranslations } from '@/utils/translations/sellerOrders';
import { useLanguage } from '@/hooks/useLanguage';

interface OrderConfirmButtonProps {
  orderId: string;
}

export const OrderConfirmButton: React.FC<OrderConfirmButtonProps> = ({ orderId }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { language } = useLanguage();
  const t = getSellerOrdersTranslations(language);
  
  const { data: orderDetails } = useQuery({
    queryKey: ['order-details', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          order_number,
          buyer:profiles!orders_buyer_id_fkey (
            opt_id
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const { data: chatScreenshots = [] } = useQuery({
    queryKey: ['confirm-images', orderId, 'chat_screenshot'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('confirm_images')
        .select('url')
        .eq('order_id', orderId)
        .eq('category', 'chat_screenshot');

      if (error) throw error;
      return data?.map(img => img.url) || [];
    }
  });

  const { data: signedProductPhotos = [] } = useQuery({
    queryKey: ['confirm-images', orderId, 'signed_product'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('confirm_images')
        .select('url')
        .eq('order_id', orderId)
        .eq('category', 'signed_product');

      if (error) throw error;
      return data?.map(img => img.url) || [];
    }
  });

  const hasChatScreenshots = chatScreenshots.length > 0;
  const hasSignedProductPhotos = signedProductPhotos.length > 0;

  return (
    <div className="space-y-3">
      {/* Status Indicators */}
      <div className="space-y-2">
        {/* Chat Screenshots Status */}
        <div
          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:opacity-80 ${
            hasChatScreenshots 
              ? 'text-green-600 border-green-200 bg-green-50' 
              : 'text-orange-600 border-orange-200 bg-orange-50'
          }`}
          onClick={() => setDialogOpen(true)}
        >
          <MessageSquare className="h-4 w-4" />
          {hasChatScreenshots ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <span className="text-sm">
            {hasChatScreenshots 
              ? t.chatScreenshotsUploaded
              : t.chatScreenshotsNeeded
            }
          </span>
        </div>

        {/* Signed Product Photos Status */}
        <div
          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:opacity-80 ${
            hasSignedProductPhotos 
              ? 'text-green-600 border-green-200 bg-green-50' 
              : 'text-orange-600 border-orange-200 bg-orange-50'
          }`}
          onClick={() => setDialogOpen(true)}
        >
          <Package className="h-4 w-4" />
          {hasSignedProductPhotos ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <span className="text-sm">
            {hasSignedProductPhotos 
              ? t.productPhotosUploaded
              : t.productPhotosNeeded
            }
          </span>
        </div>
      </div>

      {/* Upload Dialog */}
      <OrderConfirmImagesDialog 
        orderId={orderId} 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};
