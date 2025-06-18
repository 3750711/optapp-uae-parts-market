
import React, { useState, useCallback, useMemo } from 'react';
import { useAdminOrderFormLogic } from '@/hooks/useAdminOrderFormLogic';
import OptimizedSellerOrderFormFields from './OptimizedSellerOrderFormFields';
import AdvancedImageUpload from './AdvancedImageUpload';
import { CloudinaryVideoUpload } from '@/components/ui/cloudinary-video-upload';
import { CreatedOrderView } from './CreatedOrderView';
import { OrderPreviewDialog } from './OrderPreviewDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader, AlertCircle, Camera, Plus, RefreshCw } from 'lucide-react';
import { useSubmissionGuard } from '@/hooks/useSubmissionGuard';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileOrderCreationHeader } from './MobileOrderCreationHeader';
import { MobileFormSection } from './MobileFormSection';

export const AdminFreeOrderForm = React.memo(() => {
  const [showPreview, setShowPreview] = useState(false);
  const isMobile = useIsMobile();

  const {
    formData,
    handleInputChange,
    images,
    videos,
    setAllImages,
    setVideos,
    isLoading,
    createdOrder,
    handleSubmit: originalHandleSubmit,
    handleOrderUpdate,
    resetForm,
    hasAdminAccess,
    isCheckingAdmin,
    error,
    retryOperation,
    clearError,
    selectedSeller,
    buyerProfiles
  } = useAdminOrderFormLogic();

  // Стабильный submission guard
  const { guardedSubmit, canSubmit } = useSubmissionGuard({
    timeout: 10000,
    onDuplicateSubmit: useCallback(() => {
      toast({
        title: "Заказ создается",
        description: "Пожалуйста подождите, заказ уже создается",
        variant: "destructive",
      });
    }, [])
  });

  // Мемоизированные обработчики
  const onImagesUpload = useCallback((urls: string[]) => {
    console.log('📸 AdminFreeOrderForm: New images uploaded:', urls);
    setAllImages(urls);
  }, [setAllImages]);

  const onImageDelete = useCallback((url: string) => {
    console.log('🗑️ AdminFreeOrderForm: Image deleted:', url);
    setAllImages(prev => prev.filter(img => img !== url));
  }, [setAllImages]);

  const onVideoUpload = useCallback((urls: string[]) => {
    console.log('📹 AdminFreeOrderForm: New videos uploaded:', urls);
    setVideos(prev => [...prev, ...urls]);
  }, [setVideos]);

  const onVideoDelete = useCallback((url: string) => {
    console.log('🗑️ AdminFreeOrderForm: Video deleted:', url);
    setVideos(prev => prev.filter(video => video !== url));
  }, [setVideos]);

  // Валидация формы
  const canShowPreview = useCallback(() => {
    return !!(formData.title && formData.price && formData.sellerId && formData.buyerOptId);
  }, [formData.title, formData.price, formData.sellerId, formData.buyerOptId]);

  const getBuyerProfile = useCallback(() => {
    return buyerProfiles.find(buyer => buyer.opt_id === formData.buyerOptId) || null;
  }, [buyerProfiles, formData.buyerOptId]);

  // Стабильные обработчики событий
  const handleCreateOrderClick = useCallback(() => {
    if (!canShowPreview()) {
      toast({
        title: "Заполните обязательные поля",
        description: "Необходимо заполнить название, цену, продавца и OPT_ID покупателя",
        variant: "destructive",
      });
      return;
    }
    setShowPreview(true);
  }, [canShowPreview]);

  const handleConfirmOrder = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setShowPreview(false);
    guardedSubmit(async () => {
      await originalHandleSubmit(e);
    });
  }, [guardedSubmit, originalHandleSubmit]);

  const handleBackToEdit = useCallback(() => {
    setShowPreview(false);
  }, []);

  const handleRetry = useCallback(() => {
    clearError();
    retryOperation();
  }, [clearError, retryOperation]);

  // Мемоизированные вычисляемые значения
  const isFormDisabled = useMemo(() => isLoading || !canSubmit, [isLoading, canSubmit]);

  // Ранние возвраты для состояний загрузки
  if (isCheckingAdmin) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Проверка прав доступа...</p>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          У вас нет прав администратора для создания заказов
        </AlertDescription>
      </Alert>
    );
  }

  if (createdOrder) {
    return (
      <CreatedOrderView
        order={createdOrder}
        images={images}
        videos={videos}
        onNewOrder={resetForm}
        onOrderUpdate={handleOrderUpdate}
        buyerProfile={getBuyerProfile()}
      />
    );
  }

  return (
    <div className={`space-y-6 ${isMobile ? 'pb-24' : ''}`}>
      <MobileOrderCreationHeader
        title="Создание свободного заказа"
        description="Заполните информацию о заказе"
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Повторить
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <OptimizedSellerOrderFormFields
        formData={formData}
        handleInputChange={handleInputChange}
        disabled={isFormDisabled}
      />
      
      <MobileFormSection 
        title="Медиафайлы заказа" 
        icon={<Camera className="h-5 w-5" />}
        defaultOpen={true}
      >
        <div className="space-y-6">
          <div>
            <h3 className={`font-medium mb-4 ${isMobile ? 'text-base' : 'text-lg'}`}>Изображения</h3>
            <AdvancedImageUpload
              images={images}
              onImagesUpload={onImagesUpload}
              onImageDelete={onImageDelete}
              onSetPrimaryImage={() => {}}
              disabled={isFormDisabled}
              maxImages={25}
            />
          </div>

          <div>
            <h3 className={`font-medium mb-4 ${isMobile ? 'text-base' : 'text-lg'}`}>Видео</h3>
            <CloudinaryVideoUpload
              videos={videos}
              onUpload={onVideoUpload}
              onDelete={onVideoDelete}
              maxVideos={5}
              disabled={isFormDisabled}
            />
          </div>
        </div>
      </MobileFormSection>

      {isMobile ? (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
          <Button
            type="button"
            onClick={handleCreateOrderClick}
            disabled={isFormDisabled}
            size="lg"
            className="w-full touch-target min-h-[48px] text-base font-medium"
          >
            {isLoading ? 'Создание заказа...' : 'Создать заказ'}
          </Button>
        </div>
      ) : (
        <div className="flex justify-end pt-6 border-t">
          <Button
            type="button"
            onClick={handleCreateOrderClick}
            disabled={isFormDisabled}
            size="lg"
            className="min-w-[200px]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Создать заказ
          </Button>
        </div>
      )}

      <OrderPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        formData={formData}
        images={images}
        videos={videos}
        selectedSeller={selectedSeller}
        buyerProfile={getBuyerProfile()}
        onConfirm={handleConfirmOrder}
        onBack={handleBackToEdit}
        isLoading={isLoading}
      />
    </div>
  );
});

AdminFreeOrderForm.displayName = 'AdminFreeOrderForm';
