
import React, { useRef } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileOptimizedImageUpload } from "@/components/ui/MobileOptimizedImageUpload";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Upload, Camera } from "lucide-react";
import { useMobileOptimizedUpload } from "@/hooks/useMobileOptimizedUpload";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { 
    isUploading, 
    uploadProgress, 
    uploadFilesBatch,
    clearProgress
  } = useMobileOptimizedUpload();

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
      clearProgress();
    } catch (error) {
      console.error('Error uploading confirmation images:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить фотографии",
        variant: "destructive",
      });
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && canEdit) {
      const fileArray = Array.from(files);
      
      try {
        // Start upload automatically after file selection
        const uploadedUrls = await uploadFilesBatch(fileArray, {
          productId: orderId,
          batchSize: 2,
          batchDelay: 1000
        });
        
        if (uploadedUrls.length > 0) {
          await handleImageUpload(uploadedUrls);
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить изображения",
          variant: "destructive",
        });
      }
      
      // Reset input value to allow selecting same files again
      e.target.value = '';
    }
  };

  // Don't show anything if user can't edit and no images exist
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
          onImageDelete={canEdit ? handleImageDelete : undefined}
          productId={orderId}
          showGalleryOnly={true}
        />
      )}

      {canEdit && (
        <div className="space-y-2">
          {/* Upload button with photo count indicator */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUploadButtonClick}
              disabled={isUploading}
              className="h-8 px-3 text-sm relative"
            >
              <Upload className="h-4 w-4 mr-1" />
              {isUploading ? "Загрузка..." : "Загрузить фото"}
              {images.length > 0 && !isUploading && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {images.length}
                </span>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
          </div>
          
          {/* Show upload progress when uploading */}
          {isUploading && uploadProgress.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Загрузка фотографий ({uploadProgress.filter(p => p.status === 'completed').length}/{uploadProgress.length})
              </div>
              {uploadProgress.map((progress, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="truncate">{progress.file.name}</span>
                    <span>{Math.round(progress.progress)}%</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-1">
                    <div 
                      className="bg-primary h-1 rounded-full transition-all duration-300"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
