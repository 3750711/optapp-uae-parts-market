import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Package, X, Plus } from "lucide-react";

interface OrderConfirmThumbnailsProps {
  orderId: string;
  onClick: () => void;
}

export const OrderConfirmThumbnails = ({ orderId, onClick }: OrderConfirmThumbnailsProps) => {
  const { data: chatImages = [] } = useQuery({
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

  const { data: productImages = [] } = useQuery({
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

  const hasChatImages = chatImages.length > 0;
  const hasProductImages = productImages.length > 0;
  const hasAnyImages = hasChatImages || hasProductImages;

  return (
    <div 
      className="border rounded-lg p-2 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <div className="grid grid-cols-2 gap-2">
        {/* Chat Screenshots Section */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {hasChatImages ? (
              <>
                <div className="w-6 h-6 rounded overflow-hidden border shrink-0">
                  <img
                    src={chatImages[0]}
                    alt="Chat screenshot"
                    className="w-full h-full object-cover"
                  />
                </div>
                {chatImages.length > 1 && (
                  <span className="text-xs text-muted-foreground">
                    +{chatImages.length - 1}
                  </span>
                )}
              </>
            ) : (
              <div className="w-6 h-6 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center shrink-0">
                <X className="h-3 w-3 text-muted-foreground/50" />
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Чат
          </div>
        </div>

        {/* Product Photos Section */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0">
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {hasProductImages ? (
              <>
                <div className="w-6 h-6 rounded overflow-hidden border shrink-0">
                  <img
                    src={productImages[0]}
                    alt="Product photo"
                    className="w-full h-full object-cover"
                  />
                </div>
                {productImages.length > 1 && (
                  <span className="text-xs text-muted-foreground">
                    +{productImages.length - 1}
                  </span>
                )}
              </>
            ) : (
              <div className="w-6 h-6 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center shrink-0">
                <X className="h-3 w-3 text-muted-foreground/50" />
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Товар
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-muted/30">
        <div className={`text-xs font-medium ${
          hasAnyImages ? 'text-green-600' : 'text-muted-foreground'
        }`}>
          {hasAnyImages ? 'Есть подтверждения' : 'Нет подтверждений'}
        </div>
        <Plus className="h-3 w-3 text-muted-foreground" />
      </div>
    </div>
  );
};