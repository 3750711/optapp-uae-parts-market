import { useStagedCloudinaryUpload } from "@/hooks/useStagedCloudinaryUpload";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface UseOrderConfirmationUploadProps {
  orderId: string;
  category?: 'chat_screenshot' | 'signed_product' | null;
}

export function useOrderConfirmationUpload({ 
  orderId, 
  category = null 
}: UseOrderConfirmationUploadProps) {
  const hook = useStagedCloudinaryUpload();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Save uploaded URLs to database
  const saveToDatabase = useCallback(async (urls: string[]) => {
    if (urls.length === 0) return;
    
    console.log('💾 Saving confirmation images to database:', {
      orderId,
      category,
      urlCount: urls.length
    });
    
    const imageInserts = urls.map(url => ({
      order_id: orderId,
      url,
      category: category || null
    }));

    const { error } = await supabase
      .from('confirm_images')
      .insert(imageInserts);

    if (!error) {
      console.log('✅ Database save successful');
      toast({
        title: "Загрузка завершена",
        description: `Загружено ${urls.length} подтверждающих фото`,
      });
      queryClient.invalidateQueries({ queryKey: ['confirm-images', orderId] });
      return true;
    } else {
      console.error('❌ Database save error:', error);
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить фотографии",
        variant: "destructive",
      });
      return false;
    }
  }, [orderId, category, toast, queryClient]);
  
  // Upload files and auto-save to database
  const uploadFiles = useCallback(async (files: File[]) => {
    console.log('🚀 Starting upload for', files.length, 'files');
    
    const urls = await hook.uploadFiles(files);
    
    console.log('📤 Upload complete:', {
      total: files.length,
      successful: urls.length,
      failed: files.length - urls.length
    });
    
    // Auto-save successful uploads
    if (urls.length > 0) {
      await saveToDatabase(urls);
    }
    
    return urls;
  }, [hook.uploadFiles, saveToDatabase]);
  
  return {
    // Upload functions
    uploadFiles,
    saveToDatabase,
    
    // State from useStagedCloudinaryUpload
    items: hook.uploadItems,
    stagedUrls: hook.stagedUrls,
    isUploading: hook.uploadItems.some(i => 
      i.status === 'uploading' || 
      i.status === 'compressing' || 
      i.status === 'signing'
    ),
    
    // Control functions
    clearStaging: hook.clearStaging,
  };
}
