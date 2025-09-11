import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderConfirmThumbnailsProps {
  orderId: string;
  onViewPhotos?: () => void;
  onUpload: () => void;
}

export const OrderConfirmThumbnails = ({ orderId, onViewPhotos, onUpload }: OrderConfirmThumbnailsProps) => {
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

  // Debug logging for photo count discrepancy
  console.log(`📸 [OrderConfirmThumbnails] Order ${orderId}:`, {
    chatImages: chatImages,
    chatImagesLength: chatImages.length,
    productImages: productImages,
    productImagesLength: productImages.length,
    totalCount: chatImages.length + productImages.length,
    hasChatImages,
    hasProductImages,
    hasAnyImages
  });

  const renderThumbnails = (images: string[], category: string) => {
    const maxVisible = 3;
    const visibleImages = images.slice(0, maxVisible);
    const remainingCount = Math.max(0, images.length - maxVisible);

    if (images.length === 0) {
      return (
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center shrink-0">
          <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground/50" />
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        {visibleImages.map((url, index) => (
          <div key={index} className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 rounded overflow-hidden border shrink-0">
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
    <div className="border rounded-lg p-2 sm:p-3"
    >
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {/* Chat Screenshots Section */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 lg:col-span-2">
          <div className="shrink-0">
            <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {renderThumbnails(chatImages, 'Chat screenshot')}
          </div>
          <div className="text-xs text-muted-foreground hidden sm:block lg:hidden xl:block">
            Чат
          </div>
        </div>

        {/* Product Photos Section */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 lg:col-span-2">
          <div className="shrink-0">
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {renderThumbnails(productImages, 'Product photo')}
          </div>
          <div className="text-xs text-muted-foreground hidden sm:block lg:hidden xl:block">
            Товар
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 mt-2 pt-2 border-t border-muted/30">
        <Button
          variant="outline"
          size="sm"
          onClick={onViewPhotos}
          disabled={!hasAnyImages}
          className="h-6 text-xs px-3"
        >
          <span className="truncate">Показать фото</span>
          {hasAnyImages && (
            <span className="ml-1 text-xs text-muted-foreground hidden sm:inline">
              ({chatImages.length + productImages.length})
            </span>
          )}
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onUpload}
          className="h-6 text-xs px-3"
        >
          Загрузить
        </Button>
      </div>
    </div>
  );
};