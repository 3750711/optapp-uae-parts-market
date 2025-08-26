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

  const renderThumbnails = (images: string[], category: string) => {
    const maxVisible = 3;
    const visibleImages = images.slice(0, maxVisible);
    const remainingCount = Math.max(0, images.length - maxVisible);

    if (images.length === 0) {
      return (
        <div className="w-6 h-6 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center shrink-0">
          <X className="h-3 w-3 text-muted-foreground/50" />
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        {visibleImages.map((url, index) => (
          <div key={index} className="w-5 h-5 rounded overflow-hidden border shrink-0">
            <img
              src={url}
              alt={`${category} ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        {remainingCount > 0 && (
          <span className="text-xs text-muted-foreground font-medium">
            +{remainingCount}
          </span>
        )}
      </div>
    );
  };

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
            {renderThumbnails(chatImages, 'Chat screenshot')}
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
            {renderThumbnails(productImages, 'Product photo')}
          </div>
          <div className="text-xs text-muted-foreground">
            Товар
          </div>
        </div>
      </div>

      {/* Status Indicator with counts */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-muted/30">
        <div className="flex items-center gap-2 text-xs">
          <div className={`font-medium ${
            hasAnyImages ? 'text-green-600' : 'text-muted-foreground'
          }`}>
            {hasAnyImages ? 'Есть подтверждения' : 'Нет подтверждений'}
          </div>
          {hasAnyImages && (
            <div className="text-muted-foreground">
              ({chatImages.length + productImages.length})
            </div>
          )}
        </div>
        <Plus className="h-3 w-3 text-muted-foreground" />
      </div>
    </div>
  );
};