import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, SkipForward, Check, AlertCircle, Video } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileOptimizedImageUpload } from "@/components/ui/MobileOptimizedImageUpload";
import { CloudinaryVideoUpload } from "@/components/ui/cloudinary-video-upload";
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
  const [confirmVideos, setConfirmVideos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImagesUpload = async (urls: string[]) => {
    console.log("Confirmation images uploaded:", urls);
    setConfirmImages(urls);
    setUploadError(null);
  };

  const handleVideosUpload = async (urls: string[]) => {
    console.log("Confirmation videos uploaded:", urls);
    setConfirmVideos(prev => [...prev, ...urls]);
    setUploadError(null);
  };

  const handleVideoDelete = (urlToDelete: string) => {
    console.log("Deleting confirmation video:", urlToDelete);
    setConfirmVideos(prev => prev.filter(url => url !== urlToDelete));
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

  const handleSaveMedia = async () => {
    if (confirmImages.length === 0 && confirmVideos.length === 0) {
      toast({
        title: "Предупреждение",
        description: "Не загружено ни одного файла",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Сохраняем фотографии подтверждения в базу данных
      if (confirmImages.length > 0) {
        const confirmImagesData = confirmImages.map(url => ({
          order_id: orderId,
          url: url
        }));

        const { error: imagesError } = await supabase
          .from('confirm_images')
          .insert(confirmImagesData);

        if (imagesError) {
          console.error("Error saving confirmation images:", imagesError);
          throw imagesError;
        }
      }

      // Сохраняем видео подтверждения в заказ
      if (confirmVideos.length > 0) {
        // Получаем текущие видео из заказа
        const { data: currentOrder, error: fetchError } = await supabase
          .from('orders')
          .select('video_url')
          .eq('id', orderId)
          .single();

        if (fetchError) throw fetchError;

        const currentVideos = currentOrder?.video_url || [];
        const updatedVideos = [...currentVideos, ...confirmVideos];

        // Обновляем video_url в заказе
        const { error: videoError } = await supabase
          .from('orders')
          .update({ video_url: updatedVideos })
          .eq('id', orderId);

        if (videoError) {
          console.error("Error saving confirmation videos:", videoError);
          throw videoError;
        }
      }

      const totalFiles = confirmImages.length + confirmVideos.length;
      toast({
        title: "Успешно",
        description: `Загружено ${totalFiles} файлов подтверждения (${confirmImages.length} фото, ${confirmVideos.length} видео)`,
      });

      onComplete();
    } catch (error) {
      console.error("Error saving confirmation media:", error);
      const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка";
      setUploadError(`Не удалось сохранить файлы: ${errorMessage}`);
      
      toast({
        title: "Ошибка",
        description: `Не удалось сохранить файлы: ${errorMessage}`,
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
    setConfirmVideos([]);
    setUploadError(null);
  };

  const totalFiles = confirmImages.length + confirmVideos.length;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-4xl max-w-[95vw] p-4 sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Загрузка файлов подтверждения заказа
          </DialogTitle>
          <DialogDescription className="text-sm">
            Загрузите фотографии и видео, подтверждающие выполнение заказа, или пропустите этот шаг.
            Файлы можно будет добавить позже на странице заказа.
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

          {/* Вкладки для фото и видео */}
          <Tabs defaultValue="images" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="images" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Фотографии ({confirmImages.length})
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Видео ({confirmVideos.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="images" className="space-y-4 mt-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <MobileOptimizedImageUpload
                  onUploadComplete={handleImagesUpload}
                  maxImages={10}
                  existingImages={confirmImages}
                  onImageDelete={handleImageDelete}
                />
              </div>
            </TabsContent>

            <TabsContent value="videos" className="space-y-4 mt-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <CloudinaryVideoUpload
                  videos={confirmVideos}
                  onUpload={handleVideosUpload}
                  onDelete={handleVideoDelete}
                  maxVideos={5}
                  productId={orderId}
                  buttonText="Загрузить видео подтверждения"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Информация о загруженных файлах */}
          {totalFiles > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700">
                <Check className="h-4 w-4" />
                <span className="font-medium">
                  Загружено {totalFiles} файлов подтверждения
                </span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                {confirmImages.length > 0 && `${confirmImages.length} фотографий`}
                {confirmImages.length > 0 && confirmVideos.length > 0 && ', '}
                {confirmVideos.length > 0 && `${confirmVideos.length} видео`}
                {' - файлы готовы к сохранению'}
              </p>
            </div>
          )}

          {/* Подсказка для пользователя */}
          {totalFiles === 0 && !uploadError && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2 text-blue-700">
                <Upload className="h-4 w-4 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Рекомендации по файлам подтверждения:</p>
                  <ul className="mt-1 space-y-1 text-blue-600">
                    <li>• Подпишите товар номером заказа и ID покупателя</li>
                    <li>• Добавьте скриншот переписки если вы обсуждали детали с покупателем</li>
                    <li>• Добавьте скриншот переписки с обсуждения цены</li>
                  </ul>
                  <p className="font-medium mt-2">Для видео:</p>
                  <ul className="mt-1 space-y-1 text-blue-600">
                    <li>• Добавьте больше видео если вы присылали их продавцу</li>
                    <li>• Добавьте видео эндоскопии, масла и прокрутки для моторов</li>
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
            onClick={handleSaveMedia}
            disabled={isUploading || totalFiles === 0}
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
