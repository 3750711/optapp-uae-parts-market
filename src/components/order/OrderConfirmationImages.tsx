
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
  const [localImages, setLocalImages] = useState<string[]>([]); // CRITICAL: Local state for immediate UI updates
  const [uploadError, setUploadError] = useState<{
    error: string;
    attempts: UploadAttempt[];
  } | null>(null);

  const { data: existingImages = [], isLoading, isError } = useQuery({
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

  // CRITICAL: Combine existing and local images for display
  const allImages = [...new Set([...existingImages, ...localImages])];

  // Removed duplicate handleImageUpload - using MobileOptimizedImageUpload's built-in upload system

  const handleImageDelete = async (url: string) => {
    if (!canEdit) return;

    // CRITICAL FIX: Update local state immediately
    setLocalImages(prev => prev.filter(img => img !== url));

    try {
      const { error } = await supabase
        .from('confirm_images')
        .delete()
        .eq('order_id', orderId)
        .eq('url', url);

      if (error) {
        // ROLLBACK: Add back to local state if database delete fails
        setLocalImages(prev => [...prev, url]);
        throw error;
      }

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

  if (!canEdit && allImages.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground min-h-[200px] flex items-center justify-center">
        Подтверждающие фотографии не загружены.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <MobileOptimizedImageUpload
        existingImages={allImages}
        onUploadComplete={async (urls) => {
          console.log('🎯 OrderConfirmationImages - onUploadComplete called:', {
            newUrls: urls,
            existingImages: existingImages,
            localImages: localImages,
            orderId: orderId,
            totalAfter: existingImages.length + urls.length
          });
          
          // MobileOptimizedImageUpload provides URLs after successful upload
          if (Array.isArray(urls) && urls.length > 0) {
            console.log('💾 Saving new URLs to database:', urls);
            
            try {
              // URLs are already uploaded, just save them to database
              const imageInserts = urls.map(url => ({
                order_id: orderId,
                url
              }));

              console.log('📝 Database insert payload:', imageInserts);

              const { error } = await supabase
                .from('confirm_images')
                .insert(imageInserts);

              if (!error) {
                console.log('✅ Database save successful, invalidating cache...');
                toast({
                  title: "Загрузка завершена",
                  description: `Загружено ${urls.length} подтверждающих фото`,
                });
                queryClient.invalidateQueries({ queryKey: ['confirm-images', orderId] });
              } else {
                console.error('❌ Database save error:', error);
                toast({
                  title: "Ошибка сохранения",
                  description: "Не удалось сохранить URLs фотографий", 
                  variant: "destructive",
                });
              }
            } catch (error) {
              console.error('❌ Database save error:', error);
              toast({
                title: "Ошибка сохранения",
                description: "Не удалось сохранить URLs фотографий", 
                variant: "destructive",
              });
            }
          } else {
            console.warn('⚠️ No URLs provided or invalid format:', urls);
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
