
import React, { useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileOptimizedImageUpload } from "@/components/ui/MobileOptimizedImageUpload";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, AlertTriangle, Copy } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { uploadWithMultipleFallbacks } from "@/utils/uploadWithFallback";
import { offlineQueue } from "@/utils/offlineQueue";
import { uploadMetrics } from "@/utils/uploadMetrics";

interface OrderConfirmationImagesProps {
  orderId: string;
  canEdit?: boolean;
}

interface UploadAttempt {
  method: string;
  error: string;
}

// Component for showing detailed upload diagnostics
const UploadErrorDiagnostics: React.FC<{ 
  error: string; 
  attempts: UploadAttempt[]; 
  orderId: string;
  onRetry: () => void;
}> = ({ error, attempts, orderId, onRetry }) => {
  
  const copyDiagnostics = () => {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      orderId,
      error,
      attempts,
      network: {
        online: navigator.onLine,
        type: (navigator as any).connection?.effectiveType || 'unknown'
      },
      userAgent: navigator.userAgent
    };
    
    navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
    toast({ title: "Диагностика скопирована в буфер обмена" });
  };

  const { toast } = useToast();

  return (
    <Alert variant="destructive" className="mt-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Не удалось загрузить фото</AlertTitle>
      <AlertDescription>
        <div className="space-y-3 mt-2">
          <p className="font-medium">Что можно попробовать:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Проверьте подключение к интернету</li>
            <li>Попробуйте уменьшить размер фото (максимум 10MB)</li>
            <li>Используйте форматы JPG, PNG или WebP</li>
            <li>Обновите страницу и попробуйте снова</li>
          </ul>
          
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium hover:underline">
              Техническая информация
            </summary>
            <div className="mt-2 p-3 bg-black/5 rounded text-xs font-mono space-y-1">
              <p><strong>Попытки загрузки:</strong></p>
              {attempts.map((attempt, i) => (
                <div key={i} className="pl-2">
                  {i + 1}. {attempt.method}: {attempt.error}
                </div>
              ))}
              <div className="pt-2 border-t border-black/10">
                <p><strong>Сеть:</strong> {navigator.onLine ? 'Онлайн' : 'Оффлайн'}</p>
                <p><strong>Тип соединения:</strong> {(navigator as any).connection?.effectiveType || 'Неизвестно'}</p>
                <p><strong>Order ID:</strong> {orderId}</p>
              </div>
            </div>
          </details>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={onRetry} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Попробовать снова
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={copyDiagnostics}
            >
              <Copy className="h-4 w-4 mr-2" />
              Скопировать для поддержки
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export const OrderConfirmationImages: React.FC<OrderConfirmationImagesProps> = ({
  orderId,
  canEdit = false
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadError, setUploadError] = useState<{
    error: string;
    attempts: UploadAttempt[];
  } | null>(null);

  const { data: images = [], isLoading, isError } = useQuery({
    queryKey: ['confirm-images', orderId],
    queryFn: async () => {
      console.log('🔍 Fetching confirmation images for orderId:', orderId);
      
      const { data, error } = await supabase
        .from('confirm_images')
        .select('url, created_at')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data?.map(img => img.url) || [];
    }
  });

  const handleImageUpload = async (files: File[]) => {
    if (!canEdit || files.length === 0) return;
    
    console.log('📸 Starting confirmation image upload:', {
      orderId,
      filesCount: files.length,
      fileNames: files.map(f => f.name)
    });

    setUploadError(null);
    const uploadedUrls: string[] = [];
    const allAttempts: UploadAttempt[] = [];

    try {
      // Process files one by one for better error tracking
      for (const file of files) {
        uploadMetrics.start(file.name);
        
        try {
          // Try online upload first
          if (navigator.onLine) {
            const result = await uploadWithMultipleFallbacks(file, { 
              orderId,
              onProgress: (progress) => {
                console.log(`📊 Upload progress for ${file.name}: ${progress}%`);
              }
            });
            
            if (result.success && result.url) {
              uploadedUrls.push(result.url);
              uploadMetrics.end(file.name, true, result.method || 'unknown', file.size);
              console.log('✅ File uploaded successfully:', file.name, result.method);
            } else {
              // Parse attempts from error message
              const errorAttempts = result.error?.includes('Tried') ? 
                [{ method: 'all-methods', error: result.error }] : 
                [{ method: 'upload-failed', error: result.error || 'Unknown error' }];
              
              allAttempts.push(...errorAttempts);
              uploadMetrics.end(file.name, false, 'failed', file.size, result.error);
              
              throw new Error(result.error || 'Upload failed');
            }
          } else {
            // Add to offline queue
            console.log('📴 Offline - adding to queue:', file.name);
            offlineQueue.add(file, { orderId }, (success, url, error) => {
              if (success && url) {
                console.log('✅ Offline upload completed:', file.name);
                // Refresh the images query
                queryClient.invalidateQueries({ queryKey: ['confirm-images', orderId] });
              } else {
                console.error('❌ Offline upload failed:', file.name, error);
              }
            });
            
            uploadMetrics.end(file.name, false, 'offline-queued', file.size, 'Added to offline queue');
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error('❌ File upload error:', file.name, errorMsg);
          allAttempts.push({ method: 'file-processing', error: errorMsg });
          uploadMetrics.end(file.name, false, 'error', file.size, errorMsg);
        }
      }

      // Save uploaded URLs to database
      if (uploadedUrls.length > 0) {
        console.log('💾 Saving URLs to database:', uploadedUrls);
        
        const imageInserts = uploadedUrls.map(url => ({
          order_id: orderId,
          url
        }));

        const { error } = await supabase
          .from('confirm_images')
          .insert(imageInserts);

        if (error) throw error;

        toast({
          title: "Загрузка завершена",
          description: `Загружено ${uploadedUrls.length} подтверждающих фото`,
        });

        queryClient.invalidateQueries({ queryKey: ['confirm-images', orderId] });
      }

      // Show error diagnostics if some uploads failed
      if (allAttempts.length > 0) {
        setUploadError({
          error: `Не удалось загрузить ${files.length - uploadedUrls.length} из ${files.length} файлов`,
          attempts: allAttempts
        });
      }

    } catch (error) {
      console.error('❌ Database save error:', error);
      
      setUploadError({
        error: error instanceof Error ? error.message : 'Unknown error',
        attempts: allAttempts.length > 0 ? allAttempts : [
          { method: 'database-save', error: 'Не удалось сохранить URLs в базу данных' }
        ]
      });
      
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить URLs фотографий",
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
        title: "Фото удалено",
        description: "Подтверждающее фото успешно удалено",
      });

      queryClient.invalidateQueries({ queryKey: ['confirm-images', orderId] });
    } catch (error) {
      console.error('Error deleting confirmation image:', error);
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить фото",
        variant: "destructive",
      });
    }
  };

  const retryUpload = () => {
    setUploadError(null);
    // Trigger file selection again
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center p-4 text-destructive bg-destructive/10 rounded-md">
        Ошибка загрузки фотографий. Пожалуйста, обновите страницу.
      </div>
    );
  }

  if (!canEdit && images.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground min-h-[200px] flex items-center justify-center">
        Подтверждающие фотографии не загружены.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <MobileOptimizedImageUpload
        existingImages={images}
        onUploadComplete={(urls) => {
          // MobileOptimizedImageUpload provides URLs after successful upload
          if (Array.isArray(urls) && urls.length > 0) {
            // URLs are already uploaded, just save them to database
            const imageInserts = urls.map(url => ({
              order_id: orderId,
              url
            }));

            supabase
              .from('confirm_images')
              .insert(imageInserts)
              .then(({ error }) => {
                if (!error) {
                  toast({
                    title: "Загрузка завершена",
                    description: `Загружено ${urls.length} подтверждающих фото`,
                  });
                  queryClient.invalidateQueries({ queryKey: ['confirm-images', orderId] });
                } else {
                  console.error('Database save error:', error);
                  toast({
                    title: "Ошибка сохранения",
                    description: "Не удалось сохранить URLs фотографий",
                    variant: "destructive",
                  });
                }
              });
          }
        }}
        onImageDelete={canEdit ? handleImageDelete : undefined}
        maxImages={20}
        productId={orderId}
        disabled={!canEdit}
        buttonText="Загрузить подтверждающие фото"
        disableToast={true}
      />
      
      {uploadError && (
        <UploadErrorDiagnostics
          error={uploadError.error}
          attempts={uploadError.attempts}
          orderId={orderId}
          onRetry={retryUpload}
        />
      )}
    </div>
  );
};
