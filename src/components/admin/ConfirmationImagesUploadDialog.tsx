
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, SkipForward, Check, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MobileOptimizedImageUpload } from "@/components/ui/MobileOptimizedImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface ConfirmationImagesUploadDialogProps {
  open: boolean;
  orderId: string;
  onComplete: () => void;
  onSkip: () => void;
  onCancel: () => void;
}

export const ConfirmationImagesUploadDialog: React.FC<ConfirmationImagesUploadDialogProps> = ({
  open,
  orderId,
  onComplete,
  onSkip,
  onCancel,
}) => {
  const [confirmImages, setConfirmImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImagesUpload = async (urls: string[]) => {
    console.log("Confirmation images uploaded:", urls);
    setConfirmImages(urls);
    setUploadError(null); // Очищаем ошибку при успешной загрузке
  };

  const handleUploadError = (error: string) => {
    console.error("Upload error:", error);
    setUploadError(error);
    toast({
      title: "Ошибка загрузки",
      description: error,
      variant: "destructive",
    });
  };

  const handleSaveImages = async () => {
    if (confirmImages.length === 0) {
      toast({
        title: "Предупреждение",
        description: "Не загружено ни одного изображения",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Сохраняем фотографии подтверждения в базу данных
      const confirmImagesData = confirmImages.map(url => ({
        order_id: orderId,
        url: url
      }));

      const { error } = await supabase
        .from('confirm_images')
        .insert(confirmImagesData);

      if (error) {
        console.error("Error saving confirmation images:", error);
        throw error;
      }

      toast({
        title: "Успешно",
        description: `Загружено ${confirmImages.length} фотографий подтверждения`,
      });

      onComplete();
    } catch (error) {
      console.error("Error saving confirmation images:", error);
      const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка";
      setUploadError(`Не удалось сохранить фотографии: ${errorMessage}`);
      
      toast({
        title: "Ошибка",
        description: `Не удалось сохранить фотографии: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageDelete = (urlToDelete: string) => {
    console.log("Deleting confirmation image:", urlToDelete);
    setConfirmImages(prev => prev.filter(url => url !== urlToDelete));
  };

  const handleReset = () => {
    setConfirmImages([]);
    setUploadError(null);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl max-w-[95vw] p-4 sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Загрузка фото подтверждения заказа
          </DialogTitle>
          <DialogDescription className="text-sm">
            Загрузите фотографии, подтверждающие выполнение заказа, или пропустите этот шаг.
            Фотографии можно будет добавить позже на странице заказа.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Отображение ошибки загрузки */}
          {uploadError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {uploadError}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReset}
                  className="ml-2 h-6 px-2 text-xs"
                >
                  Попробовать снова
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Компонент загрузки изображений */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <MobileOptimizedImageUpload
              onUploadComplete={handleImagesUpload}
              maxImages={10}
              existingImages={confirmImages}
              onImageDelete={handleImageDelete}
            />
          </div>

          {/* Информация о загруженных изображениях */}
          {confirmImages.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700">
                <Check className="h-4 w-4" />
                <span className="font-medium">
                  Загружено {confirmImages.length} фотографий подтверждения
                </span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Изображения готовы к сохранению в заказе
              </p>
            </div>
          )}

          {/* Подсказка для пользователя */}
          {confirmImages.length === 0 && !uploadError && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2 text-blue-700">
                <Upload className="h-4 w-4 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Рекомендации по фотографиям:</p>
                  <ul className="mt-1 space-y-1 text-blue-600">
                    <li>• Сфотографируйте товар после упаковки</li>
                    <li>• Включите этикетки или документы</li>
                    <li>• Убедитесь, что изображения четкие</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex sm:justify-between justify-between gap-3 mt-6">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Отмена
            </Button>
            <Button 
              variant="secondary" 
              onClick={onSkip}
              className="flex items-center gap-2"
            >
              <SkipForward className="h-4 w-4" />
              Пропустить
            </Button>
          </div>
          
          <Button
            onClick={handleSaveImages}
            disabled={isUploading || confirmImages.length === 0}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Сохранить и продолжить
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
