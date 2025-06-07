
import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileOptimizedImageUpload } from "@/components/ui/MobileOptimizedImageUpload";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface OrderConfirmationImagesProps {
  orderId: string;
  canEdit?: boolean;
}

export const OrderConfirmationImages: React.FC<OrderConfirmationImagesProps> = ({
  orderId,
  canEdit = false
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: images = [] } = useQuery({
    queryKey: ['confirm-images', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('confirm_images')
        .select('url')
        .eq('order_id', orderId);

      if (error) throw error;
      return data?.map(img => img.url) || [];
    }
  });

  const handleImageUpload = async (urls: string[]) => {
    if (!canEdit) return;

    setIsUploading(true);
    try {
      // Save new images to confirm_images table
      const imageInserts = urls.map(url => ({
        order_id: orderId,
        url
      }));

      const { error } = await supabase
        .from('confirm_images')
        .insert(imageInserts);

      if (error) throw error;

      toast({
        title: "Успех",
        description: `Загружено ${urls.length} подтверждающих фотографий`,
      });

      // Refetch images
      queryClient.invalidateQueries({ queryKey: ['confirm-images', orderId] });
      setShowUpload(false);
    } catch (error) {
      console.error('Error uploading confirmation images:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить фотографии",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageDelete = async (url: string) => {
    if (!canEdit) return;

    try {
      const { error } = await supabase
        .from('confirm_images')
        .delete()
        .eq('order_id', orderId)
        .eq('url', url);

      if (error) throw error;

      toast({
        title: "Успех",
        description: "Фотография удалена",
      });

      // Refetch images
      queryClient.invalidateQueries({ queryKey: ['confirm-images', orderId] });
    } catch (error) {
      console.error('Error deleting confirmation image:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить фотографию",
        variant: "destructive",
      });
    }
  };

  const handleUploadButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Convert FileList to array and handle upload
      const fileArray = Array.from(files);
      // Here we would need to implement the actual upload logic
      // For now, let's show the upload component
      setShowUpload(true);
    }
  };

  if (!canEdit && images.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        Подтверждающие фотографии не загружены
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Always show existing images gallery if they exist */}
      {images.length > 0 && (
        <MobileOptimizedImageUpload
          onUploadComplete={() => {}}
          maxImages={10}
          existingImages={images}
          productId={orderId}
          showGalleryOnly={true}
        />
      )}

      {canEdit && (
        <div className="space-y-2">
          {/* Always show upload button for admins */}
          {!showUpload && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUploadButtonClick}
                className="h-8 px-3 text-sm"
              >
                <Upload className="h-4 w-4 mr-1" />
                Загрузить фото
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
          
          {/* Show upload component when user clicks to upload */}
          {showUpload && (
            <>
              <MobileOptimizedImageUpload
                onUploadComplete={handleImageUpload}
                maxImages={10}
                existingImages={images}
                onImageDelete={handleImageDelete}
                productId={orderId}
                buttonText="Загрузить подтверждающие фото"
                showOnlyButton={false}
              />
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUpload(false)}
                  className="h-6 px-2 text-xs"
                >
                  Скрыть
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
