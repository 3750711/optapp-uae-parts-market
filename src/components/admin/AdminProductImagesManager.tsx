
import React, { useState, useCallback } from "react";
import { X, Camera, ImagePlus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { processImageForUpload, logImageProcessing, updateProductHasPreviewFlag } from "@/utils/imageProcessingUtils";

interface AdminProductImagesManagerProps {
  productId: string;
  images: string[];
  onImagesChange: (urls: string[]) => void;
}

export const AdminProductImagesManager: React.FC<AdminProductImagesManagerProps> = ({
  productId,
  images,
  onImagesChange,
}) => {
  const { toast } = useToast();
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  
  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  // Helper to extract storage path from URL
  const extractStoragePath = (url: string): string | null => {
    try {
      if (url.includes('/order-images/')) {
        return 'order-images/' + url.split('/').slice(url.split('/').findIndex(p => p === 'order-images') + 1).join('/');
      } else if (url.includes('/product-images/')) {
        return 'product-images/' + url.split('/').slice(url.split('/').findIndex(p => p === 'product-images') + 1).join('/');  
      } else {
        // Fallback to original approach
        return url.split('/').slice(url.split('/').findIndex(p => p === 'storage') + 2).join('/');
      }
    } catch (error) {
      console.error("Failed to extract path from URL:", url, error);
      return null;
    }
  };

  // Helper to extract bucket from URL
  const extractBucket = (url: string): string => {
    if (url.includes('/order-images/')) {
      return 'order-images';
    } else if (url.includes('/product-images/')) {
      return 'product-images';
    }
    return 'product-images'; // Default bucket
  };

  // Helper to create preview URL from original URL
  const getPreviewUrl = (originalUrl: string): string => {
    const urlParts = originalUrl.split('.');
    const extension = urlParts.pop() || '';
    const basePath = urlParts.join('.');
    return `${basePath}-preview.webp`;
  };
  
  // Function to generate previews for uploaded images
  const generatePreviews = async () => {
    if (!productId) {
      console.error("Cannot generate previews: Missing product ID");
      toast({
        title: "Ошибка",
        description: "ID продукта не указан",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsGeneratingPreviews(true);
      logImageProcessing('PreviewGeneration', { 
        productId, 
        action: 'manual_trigger', 
        timestamp: new Date().toISOString() 
      });
      
      console.log(`Generating previews for product ${productId}`);
      
      // Call the Edge Function to generate previews
      const { data, error } = await supabase.functions.invoke('generate-preview', {
        body: { 
          action: 'process_product',
          productId
        }
      });
      
      if (error) {
        console.error("Error generating previews:", error);
        logImageProcessing('PreviewGenerationError', { 
          productId, 
          error: error.message
        });
        toast({
          title: "Предупреждение",
          description: "Не удалось создать превью изображений",
          variant: "default",
        });
      } else {
        console.log("Preview generation response:", data);
        logImageProcessing('PreviewGenerationSuccess', { 
          productId, 
          response: data,
          successCount: data.successCount || 0,
          processed: data.processed || 0
        });
        
        // Check if previews were actually created in the database
        const { data: imagesData, error: imagesError } = await supabase
          .from('product_images')
          .select('id, url, preview_url')
          .eq('product_id', productId);
          
        if (imagesError) {
          logImageProcessing('PreviewDbCheckError', {
            productId,
            error: imagesError.message
          });
        } else {
          const withPreview = imagesData?.filter(img => !!img.preview_url)?.length || 0;
          const total = imagesData?.length || 0;
          
          logImageProcessing('PreviewDbCheck', {
            productId,
            totalImages: total,
            imagesWithPreview: withPreview
          });
          
          toast({
            title: "Успешно",
            description: `Превью созданы для ${withPreview} из ${total} изображений`,
          });
        }
        
        // Update the has_preview flag in the database
        await updateProductHasPreviewFlag(productId);
      }
    } catch (err) {
      console.error("Failed to generate previews:", err);
      logImageProcessing('PreviewGenerationException', { 
        productId, 
        error: err instanceof Error ? err.message : String(err)
      });
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при создании превью",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPreviews(false);
    }
  };
  
  // Function to update the has_preview flag
  const updateProductHasPreviewFlagLocal = async () => {
    try {
      const { error } = await supabase.rpc('update_product_has_preview_flag', { 
        p_product_id: productId 
      });
      
      if (error) {
        console.error("Error updating product has_preview flag:", error);
        logImageProcessing('FlagUpdateError', { 
          productId, 
          error: error.message 
        });
      } else {
        logImageProcessing('FlagUpdateSuccess', { 
          productId 
        });
      }
    } catch (err) {
      console.error("Exception updating has_preview flag:", err);
      logImageProcessing('FlagUpdateException', { 
        productId, 
        error: err instanceof Error ? err.message : String(err)
      });
    }
  };
  
  const handleImageDelete = useCallback(async (url: string) => {
    if (images.length <= 1) {
      toast({
        title: "Внимание",
        description: "Должна остаться хотя бы одна фотография",
        variant: "destructive",
      });
      return;
    }
    
    setDeletingUrl(url);
    try {
      // Extract path from the URL for storage removal
      const path = extractStoragePath(url);
      const bucket = extractBucket(url);
      
      if (!path) throw new Error("Could not determine file path");

      // Also try to delete the preview image if it exists
      const previewUrl = getPreviewUrl(url);
      const previewPath = extractStoragePath(previewUrl);
      
      // Delete original image
      const { error: storageErr } = await supabase.storage
        .from(bucket)
        .remove([path]);
        
      if (storageErr) throw storageErr;

      // Try to delete preview image if it exists
      if (previewPath) {
        try {
          await supabase.storage.from(bucket).remove([previewPath]);
        } catch (previewErr) {
          // We don't throw here, as the preview might not exist
          console.warn("Could not delete preview image, it might not exist:", previewErr);
        }
      }
      
      // Delete database reference
      const { error: dbErr } = await supabase
        .from('product_images')
        .delete()
        .eq('url', url)
        .eq('product_id', productId);
        
      if (dbErr) throw dbErr;
      
      onImagesChange(images.filter(img => img !== url));
      
      // Update has_preview flag after deletion
      await updateProductHasPreviewFlagLocal();
      
      toast({ title: "Фото удалено" });
    } catch (error: any) {
      toast({
        title: "Ошибка удаления",
        description: error?.message || "Не удалось удалить фото",
        variant: "destructive",
      });
    } finally {
      setDeletingUrl(null);
    }
  }, [images, productId, onImagesChange, toast]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const newUrls: string[] = [];
      logImageProcessing('AdminUploadStart', { 
        fileCount: files.length,
        productId
      });
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check if file is an image
        if (!file.type.startsWith('image/')) {
          logImageProcessing('InvalidFileType', { 
            filename: file.name, 
            type: file.type,
            productId
          });
          toast({
            title: "Ошибка",
            description: `${file.name} не является изображением`,
            variant: "destructive",
          });
          continue;
        }
        
        logImageProcessing('ProcessingUpload', { 
          filename: file.name, 
          size: file.size,
          type: file.type,
          productId
        });
        
        // Use the unified image processing utility
        const processed = await processImageForUpload(file);
        
        // Generate a unique filename with timestamp and random string
        const fileExt = processed.optimizedFile.name.split('.').pop();
        const uniqueId = `admin-upload-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        const fileName = `${uniqueId}.${fileExt}`;
        
        // Upload original image to Supabase storage
        const { data: originalData, error: originalError } = await supabase.storage
          .from('product-images')
          .upload(fileName, processed.optimizedFile, {
            cacheControl: '3600',
            contentType: processed.optimizedFile.type,
          });
          
        if (originalError) {
          console.error("Original upload error:", originalError);
          logImageProcessing('UploadError', { 
            filename: fileName, 
            error: originalError.message,
            productId
          });
          toast({
            title: "Ошибка загрузки",
            description: originalError.message,
            variant: "destructive",
          });
          continue;
        }

        // Get public URL for original image
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
          
        // Variable to store preview URL
        let previewUrl = null;
        
        // Upload preview image if available
        if (processed.previewFile) {
          const previewFileName = `${uniqueId}-preview.webp`;
          
          const { data: previewData, error: previewError } = await supabase.storage
            .from('product-images')
            .upload(previewFileName, processed.previewFile, {
              cacheControl: '3600',
              contentType: 'image/webp',
            });
            
          // Get public URL for preview image if upload was successful
          if (!previewError) {
            const { data: { publicUrl: previewPublicUrl } } = supabase.storage
              .from('product-images')
              .getPublicUrl(previewFileName);
              
            previewUrl = previewPublicUrl;
            
            logImageProcessing('PreviewCreated', { 
              originalUrl: publicUrl,
              previewUrl,
              originalSize: processed.optimizedFile.size,
              previewSize: processed.previewFile.size,
              productId
            });
          } else {
            console.warn("Preview upload error:", previewError);
            logImageProcessing('PreviewUploadError', { 
              filename: previewFileName, 
              error: previewError.message,
              productId
            });
          }
        }
        
        // Save reference in the database with both URLs
        const { error: dbError } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            url: publicUrl,
            is_primary: images.length === 0, // First image is primary if no images exist
            preview_url: previewUrl // This may be null if preview upload failed
          });
          
        if (dbError) {
          console.error("Database error:", dbError);
          logImageProcessing('DatabaseError', { 
            productId,
            error: dbError.message
          });
          toast({
            title: "Ошибка сохранения",
            description: dbError.message,
            variant: "destructive",
          });
          continue;
        }
        
        newUrls.push(publicUrl);
      }
      
      if (newUrls.length > 0) {
        onImagesChange([...images, ...newUrls]);
        
        // Always explicitly update the has_preview flag after uploads
        await updateProductHasPreviewFlagLocal();
        
        // After all images are uploaded and inserted into the database, 
        // call the Edge Function directly to ensure preview generation
        try {
          logImageProcessing('TriggeringEdgeFunction', { 
            productId, 
            action: 'auto_after_upload',
            newImageCount: newUrls.length
          });
          
          const { error: functionError } = await supabase.functions.invoke('generate-preview', {
            body: { 
              action: 'process_product', 
              productId 
            }
          });
          
          if (functionError) {
            console.error("Error calling generate-preview function:", functionError);
            logImageProcessing('EdgeFunctionError', { 
              productId, 
              error: functionError.message
            });
          } else {
            logImageProcessing('EdgeFunctionSuccess', { 
              productId
            });
            
            // Double-check the database was updated properly
            setTimeout(async () => {
              try {
                const { data: checkImages } = await supabase
                  .from('product_images')
                  .select('id, url, preview_url')
                  .eq('product_id', productId);
                  
                const imagesWithPreview = checkImages?.filter(img => !!img.preview_url).length || 0;
                const totalImages = checkImages?.length || 0;
                
                logImageProcessing('DatabaseCheckAfterUpload', {
                  productId,
                  totalImages,
                  imagesWithPreview,
                  allHavePreview: imagesWithPreview === totalImages
                });
                
                // If any images are missing previews, try to run the update function again
                if (imagesWithPreview < totalImages) {
                  logImageProcessing('RetryingPreviewGeneration', { productId });
                  await generatePreviews();
                }
              } catch (checkError) {
                logImageProcessing('DatabaseCheckError', {
                  productId,
                  error: checkError instanceof Error ? checkError.message : String(checkError)
                });
              }
            }, 3000); // Wait 3 seconds to check database
          }
        } catch (functionError) {
          console.error("Exception calling generate-preview function:", functionError);
          logImageProcessing('EdgeFunctionException', { 
            productId, 
            error: functionError instanceof Error ? functionError.message : String(functionError)
          });
        }
        
        toast({ 
          title: "Успешно", 
          description: `Загружено ${newUrls.length} фото` 
        });
      }
    } catch (error: any) {
      console.error("Error uploading images:", error);
      logImageProcessing('UploadException', { 
        productId,
        error: error?.message || "Unknown error"
      });
      toast({
        title: "Ошибка",
        description: error?.message || "Не удалось загрузить фото",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  }, [images, productId, onImagesChange, toast]);

  const openFileDialog = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, []);

  const openCameraDialog = useCallback(() => {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  }, []);

  if (!images.length) return null;
  return (
    <div className="mb-4">
      <div className="text-xs font-medium mb-1">Фотографии</div>
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, idx) => (
          <div key={img} className="relative group rounded-md overflow-hidden border aspect-square">
            <img 
              src={img} 
              alt={`Фото ${idx + 1}`} 
              className="w-full h-full object-cover" 
              loading="lazy"
              decoding="async"
            />
            <button
              type="button"
              aria-label="Удалить фото"
              className="absolute top-2 right-2 p-1 bg-red-600 bg-opacity-80 rounded-full text-white opacity-80 hover:opacity-100 focus:outline-none focus:ring-2"
              onClick={() => handleImageDelete(img)}
              disabled={deletingUrl === img}
            >
              <X size={16}/>
            </button>
            {idx === 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-1">
                <p className="text-white text-xs text-center">Главное фото</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2 flex-wrap">
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageUpload}
          disabled={isUploading}
        />
        
        <input
          type="file"
          multiple
          accept="image/*"
          capture="environment"
          className="hidden"
          ref={cameraInputRef}
          onChange={handleImageUpload}
          disabled={isUploading}
        />
        
        <Button
          type="button"
          variant="outline" 
          size="sm"
          disabled={isUploading}
          className="flex items-center gap-1 text-xs flex-1"
          onClick={openFileDialog}
        >
          {isUploading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ImagePlus className="h-3 w-3" />
          )}
          Галерея
        </Button>
        
        {isMobile() && (
          <Button
            type="button"
            variant="outline" 
            size="sm"
            disabled={isUploading}
            className="flex items-center gap-1 text-xs flex-1"
            onClick={openCameraDialog}
          >
            <Camera className="h-3 w-3" />
            Камера
          </Button>
        )}
        
        <Button
          type="button"
          variant="outline" 
          size="sm"
          onClick={generatePreviews}
          disabled={isGeneratingPreviews}
          className="flex items-center gap-1 text-xs"
        >
          {isGeneratingPreviews ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : null}
          Создать превью
        </Button>
      </div>
    </div>
  );
};
