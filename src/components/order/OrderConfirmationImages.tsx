
import React, { useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileOptimizedImageUpload } from "@/components/ui/MobileOptimizedImageUpload";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, AlertTriangle, Copy } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useOrderConfirmationUpload } from "@/hooks/useOrderConfirmationUpload";
import UploadProgressIndicator from "@/components/ui/optimized-image-upload/UploadProgressIndicator";

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
  
  // Use new upload system
  const { 
    uploadFiles, 
    items: uploadItems, 
    isUploading,
    clearStaging 
  } = useOrderConfirmationUpload({ orderId });

  const { data: images = [], isLoading, isError } = useQuery({
    queryKey: ['confirm-images', orderId],
    queryFn: async () => {
      console.log('🔍 Fetching confirmation images for orderId:', orderId);
      
      const { data, error } = await supabase
        .from('confirm_images')
        .select('url, created_at')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      console.log('📸 Fetched images result:', {
        count: data?.length || 0,
        urls: data?.map(img => img.url) || [],
        error: error?.message
      });

      if (error) throw error;
      return data?.map(img => img.url) || [];
    }
  });

  // Removed duplicate handleImageUpload - using MobileOptimizedImageUpload's built-in upload system

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

  const handleFilesUpload = async (files: File[]) => {
    console.log('📤 Uploading', files.length, 'confirmation files');
    await uploadFiles(files);
  };
  
  // Failed items for error display
  const failedItems = uploadItems.filter(i => i.status === 'error');

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
        onFilesUpload={handleFilesUpload}
        uploadProgress={uploadItems.map(item => ({
          fileId: item.id,
          fileName: item.file.name,
          progress: item.progress,
          status: (item.status === 'compressing' || item.status === 'signing') ? 'processing' : 
                  (item.status === 'pending') ? 'pending' :
                  (item.status === 'uploading') ? 'uploading' :
                  (item.status === 'success') ? 'success' : 'error',
          error: item.error
        }))}
        onImageDelete={canEdit ? handleImageDelete : undefined}
        maxImages={50}
        productId={orderId}
        disabled={!canEdit || isUploading}
        buttonText="Загрузить подтверждающие фото"
        disableToast={true}
      />
      
      {/* Detailed progress indicator */}
      {uploadItems.length > 0 && (
        <UploadProgressIndicator
          uploads={uploadItems.map(item => ({
            id: item.id,
            file: item.file,
            progress: item.progress,
            status: (item.status === 'compressing' || item.status === 'signing') ? 'processing' : 
                    (item.status === 'pending') ? 'pending' :
                    (item.status === 'uploading') ? 'uploading' :
                    (item.status === 'success') ? 'success' : 'error',
            error: item.error
          }))}
          onClear={clearStaging}
        />
      )}
      
      {/* Error display for failed uploads */}
      {failedItems.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Не удалось загрузить {failedItems.length} файлов</AlertTitle>
          <AlertDescription>
            <div className="space-y-1 mt-2">
              {failedItems.map(item => (
                <div key={item.id} className="text-sm">
                  <strong>{item.file.name}:</strong> {item.error}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
