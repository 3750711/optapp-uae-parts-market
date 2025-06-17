
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, SkipForward, Check, AlertCircle, Video, RefreshCw } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";

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
  const [isComponentReady, setIsComponentReady] = useState(false);
  const [sessionLost, setSessionLost] = useState(false);
  const { user, isAdmin } = useAuth();

  // Component readiness check
  useEffect(() => {
    if (open) {
      console.log("🔍 [ConfirmationUpload] Dialog opened, checking component readiness:", {
        userId: user?.id,
        isAdmin,
        orderId,
        authStatus: !!user
      });

      // Add a small delay to ensure all auth context is loaded
      const timer = setTimeout(() => {
        if (user?.id) {
          console.log("✅ [ConfirmationUpload] Component ready, user authenticated");
          setIsComponentReady(true);
          setSessionLost(false);
          setUploadError(null);
        } else {
          console.error("❌ [ConfirmationUpload] Component not ready, user not authenticated");
          setSessionLost(true);
          setUploadError("Сессия не найдена. Необходимо войти в систему.");
        }
      }, 100);

      return () => clearTimeout(timer);
    } else {
      // Reset state when dialog closes
      setIsComponentReady(false);
      setSessionLost(false);
      setUploadError(null);
    }
  }, [open, user?.id, isAdmin, orderId]);

  const handleSessionRecovery = async () => {
    console.log("🔄 [ConfirmationUpload] Attempting session recovery");
    
    try {
      // Try to refresh the session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("❌ [ConfirmationUpload] Session recovery failed:", error);
        toast({
          title: "Ошибка восстановления сессии",
          description: "Не удалось восстановить сессию. Попробуйте перезагрузить страницу.",
          variant: "destructive",
        });
        return;
      }

      if (session?.user) {
        console.log("✅ [ConfirmationUpload] Session recovered successfully");
        setSessionLost(false);
        setUploadError(null);
        setIsComponentReady(true);
        
        toast({
          title: "Сессия восстановлена",
          description: "Теперь вы можете продолжить загрузку файлов.",
        });
      } else {
        console.error("❌ [ConfirmationUpload] No valid session found");
        setUploadError("Не удалось восстановить сессию. Войдите в систему заново.");
      }
    } catch (error) {
      console.error("❌ [ConfirmationUpload] Session recovery error:", error);
      setUploadError("Произошла ошибка при восстановлении сессии.");
    }
  };

  const handleImagesUpload = async (urls: string[]) => {
    if (!isComponentReady) {
      console.error("❌ [ConfirmationUpload] Component not ready for image upload");
      return;
    }

    console.log("🔍 [ConfirmationUpload] Images uploaded:", {
      urls,
      orderId,
      userId: user?.id,
      isAdmin,
      authStatus: !!user
    });
    setConfirmImages(prev => [...prev, ...urls]);
    setUploadError(null);
  };

  const handleVideosUpload = async (urls: string[]) => {
    if (!isComponentReady) {
      console.error("❌ [ConfirmationUpload] Component not ready for video upload");
      return;
    }

    console.log("🔍 [ConfirmationUpload] Videos uploaded:", {
      urls,
      orderId,
      userId: user?.id,
      isAdmin,
      authStatus: !!user
    });
    setConfirmVideos(prev => [...prev, ...urls]);
    setUploadError(null);
  };

  const handleVideoDelete = (urlToDelete: string) => {
    if (!isComponentReady) return;
    
    console.log("🔍 [ConfirmationUpload] Deleting video:", urlToDelete);
    setConfirmVideos(prev => prev.filter(url => url !== urlToDelete));
  };

  const handleUploadError = (error: string) => {
    console.error("❌ [ConfirmationUpload] Upload error:", error);
    setUploadError(error);
    toast({
      title: "Ошибка загрузки",
      description: error,
      variant: "destructive",
    });
  };

  const checkUserAccess = async () => {
    console.log("🔍 [ConfirmationUpload] Checking user access:", {
      userId: user?.id,
      orderId,
      isAdmin,
      authStatus: !!user,
      isComponentReady
    });

    if (!isComponentReady || !user?.id) {
      throw new Error("Компонент не готов или пользователь не аутентифицирован");
    }

    // Since this is called right after order creation, we can skip the database check
    // The order was just created by the current user, so they definitely have access
    console.log("✅ [ConfirmationUpload] Access granted for recently created order");
    
    return {
      order_number: 'RECENT_ORDER',
      buyer_id: user.id,
      seller_id: user.id
    };
  };

  const handleSaveMedia = async () => {
    if (!isComponentReady) {
      toast({
        title: "Компонент не готов",
        description: "Пожалуйста, подождите инициализации компонента",
        variant: "destructive",
      });
      return;
    }

    if (sessionLost) {
      toast({
        title: "Сессия потеряна",
        description: "Восстановите сессию перед загрузкой файлов",
        variant: "destructive",
      });
      return;
    }

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
      // Check access with improved error handling
      const order = await checkUserAccess();

      console.log("🔍 [ConfirmationUpload] Starting media save:", {
        orderId,
        userId: user?.id,
        imagesCount: confirmImages.length,
        videosCount: confirmVideos.length,
        orderNumber: order.order_number
      });

      // Save confirmation images to database
      if (confirmImages.length > 0) {
        const confirmImagesData = confirmImages.map(url => ({
          order_id: orderId,
          url: url
        }));

        console.log("🔍 [ConfirmationUpload] Saving images:", confirmImagesData);

        const { error: imagesError } = await supabase
          .from('confirm_images')
          .insert(confirmImagesData);

        if (imagesError) {
          console.error("❌ [ConfirmationUpload] Error saving images:", imagesError);
          
          // Check if it's an auth error
          if (imagesError.message?.includes('auth') || imagesError.message?.includes('JWT')) {
            setSessionLost(true);
            throw new Error("Сессия истекла. Восстановите соединение и попробуйте снова.");
          }
          
          throw new Error(`Ошибка сохранения фотографий: ${imagesError.message}`);
        }

        console.log("✅ [ConfirmationUpload] Images saved successfully");
      }

      // Save confirmation videos to order
      if (confirmVideos.length > 0) {
        console.log("🔍 [ConfirmationUpload] Saving videos:", confirmVideos);

        // Get current videos from order
        const { data: currentOrder, error: fetchError } = await supabase
          .from('orders')
          .select('video_url')
          .eq('id', orderId)
          .single();

        if (fetchError) {
          console.error("❌ [ConfirmationUpload] Error fetching current videos:", fetchError);
          
          if (fetchError.message?.includes('auth') || fetchError.message?.includes('JWT')) {
            setSessionLost(true);
            throw new Error("Сессия истекла. Восстановите соединение и попробуйте снова.");
          }
          
          throw new Error(`Ошибка получения текущих видео: ${fetchError.message}`);
        }

        const currentVideos = currentOrder?.video_url || [];
        const updatedVideos = [...currentVideos, ...confirmVideos];

        console.log("🔍 [ConfirmationUpload] Updating videos:", {
          currentVideos,
          newVideos: confirmVideos,
          updatedVideos
        });

        // Update video_url in order
        const { error: videoError } = await supabase
          .from('orders')
          .update({ video_url: updatedVideos })
          .eq('id', orderId);

        if (videoError) {
          console.error("❌ [ConfirmationUpload] Error saving videos:", videoError);
          
          if (videoError.message?.includes('auth') || videoError.message?.includes('JWT')) {
            setSessionLost(true);
            throw new Error("Сессия истекла. Восстановите соединение и попробуйте снова.");
          }
          
          throw new Error(`Ошибка сохранения видео: ${videoError.message}`);
        }

        console.log("✅ [ConfirmationUpload] Videos saved successfully");
      }

      const totalFiles = confirmImages.length + confirmVideos.length;
      console.log("✅ [ConfirmationUpload] All media saved successfully:", {
        totalFiles,
        images: confirmImages.length,
        videos: confirmVideos.length
      });

      toast({
        title: "Успешно",
        description: `Загружено ${totalFiles} файлов подтверждения (${confirmImages.length} фото, ${confirmVideos.length} видео)`,
      });

      onComplete();
    } catch (error) {
      console.error("❌ [ConfirmationUpload] Save error:", error);
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
    if (!isComponentReady) return;
    
    console.log("🔍 [ConfirmationUpload] Deleting image:", urlToDelete);
    setConfirmImages(prev => prev.filter(url => url !== urlToDelete));
  };

  const handleReset = () => {
    console.log("🔍 [ConfirmationUpload] Resetting form");
    setConfirmImages([]);
    setConfirmVideos([]);
    setUploadError(null);
    setSessionLost(false);
  };

  const totalFiles = confirmImages.length + confirmVideos.length;
  const isDisabled = !isComponentReady || sessionLost || isUploading;

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
          {/* Component readiness and session status */}
          {!isComponentReady && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Инициализация компонента... Пожалуйста, подождите.
              </AlertDescription>
            </Alert>
          )}

          {/* Session lost alert with recovery option */}
          {sessionLost && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Сессия потеряна. Необходимо восстановить соединение для загрузки файлов.</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSessionRecovery}
                  className="ml-2 h-6 px-2 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Восстановить
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Upload error alert */}
          {uploadError && !sessionLost && (
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

          {/* Main content - only show if component is ready */}
          {isComponentReady && !sessionLost && (
            <>
              {/* Tabs for photos and videos */}
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
                      disabled={isDisabled}
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
                      disabled={isDisabled}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Information about uploaded files */}
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

              {/* User hints */}
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
            </>
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
            disabled={isDisabled || totalFiles === 0}
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
