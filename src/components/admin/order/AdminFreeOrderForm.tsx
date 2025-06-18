import React, { useState } from 'react';
import { useAdminOrderFormLogic } from '@/hooks/useAdminOrderFormLogic';
import OptimizedSellerOrderFormFields from './OptimizedSellerOrderFormFields';
import { CompactOrderMediaGallery } from './CompactOrderMediaGallery';
import { OrderMediaUploadButtons } from './OrderMediaUploadButtons';
import { CreatedOrderView } from './CreatedOrderView';
import { OrderPreviewDialog } from './OrderPreviewDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader, AlertCircle, Camera, Plus, RefreshCw, Database } from 'lucide-react';
import { useSubmissionGuard } from '@/hooks/useSubmissionGuard';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileOrderCreationHeader } from './MobileOrderCreationHeader';
import { MobileFormSection } from './MobileFormSection';

export const AdminFreeOrderForm = () => {
  const [showPreview, setShowPreview] = useState(false);
  const isMobile = useIsMobile();

  const {
    // Form data
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
    
    // Admin access
    hasAdminAccess,
    isCheckingAdmin,
    
    // Error handling
    error,
    retryOperation,
    clearError,
    
    // Additional data for preview
    selectedSeller,
    buyerProfiles,
    
    // Loading states
    isInitializing,
    isLoadingBuyers,
    isLoadingSellers,
    isLoadingBrands
  } = useAdminOrderFormLogic();

  // Add submission guard
  const { guardedSubmit, canSubmit } = useSubmissionGuard({
    timeout: 10000,
    onDuplicateSubmit: () => {
      toast({
        title: "Заказ создается",
        description: "Пожалуйста подождите, заказ уже создается",
        variant: "destructive",
      });
    }
  });

  const onImagesUpload = (urls: string[]) => {
    console.log('📸 AdminFreeOrderForm: New images uploaded:', urls);
    // Добавляем новые изображения к существующим
    setAllImages([...images, ...urls]);
  };

  const onImageDelete = (url: string) => {
    console.log('🗑️ AdminFreeOrderForm: Image deleted:', url);
    const newImages = images.filter(img => img !== url);
    setAllImages(newImages);
  };

  const onVideoUpload = (urls: string[]) => {
    console.log('📹 AdminFreeOrderForm: New videos uploaded:', urls);
    setVideos(prev => [...prev, ...urls]);
  };

  const onVideoDelete = (url: string) => {
    console.log('🗑️ AdminFreeOrderForm: Video deleted:', url);
    setVideos(prev => prev.filter(video => video !== url));
  };

  const handleCreateOrderClick = () => {
    console.log('🔍 Checking form validation:', {
      title: formData.title,
      price: formData.price,
      sellerId: formData.sellerId,
      buyerOptId: formData.buyerOptId,
      formData: formData
    });

    if (!canShowPreview()) {
      toast({
        title: "Заполните обязательные поля",
        description: "Необходимо заполнить название, цену, продавца и OPT_ID покупателя",
        variant: "destructive",
      });
      return;
    }
    setShowPreview(true);
  };

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPreview(false);
    guardedSubmit(async () => {
      await originalHandleSubmit(e);
    });
  };

  const handleBackToEdit = () => {
    setShowPreview(false);
  };

  const canShowPreview = () => {
    const isValid = formData.title && 
                   formData.price && 
                   formData.sellerId && 
                   formData.buyerOptId;
    
    console.log('🔍 Form validation result:', {
      title: !!formData.title,
      price: !!formData.price,
      sellerId: !!formData.sellerId,
      buyerOptId: !!formData.buyerOptId,
      isValid: isValid
    });
    
    return isValid;
  };

  const getBuyerProfile = () => {
    return buyerProfiles.find(buyer => buyer.opt_id === formData.buyerOptId) || null;
  };

  const handleRetry = () => {
    clearError();
    retryOperation();
  };

  // Показать состояние загрузки админа
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

  // Показать состояние инициализации данных
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Database className="h-8 w-8 animate-pulse mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600 font-medium">Загрузка данных...</p>
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center justify-center gap-2">
              {isLoadingBuyers ? (
                <Loader className="h-3 w-3 animate-spin" />
              ) : (
                <div className="h-3 w-3 bg-green-500 rounded-full" />
              )}
              <span>Покупатели</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              {isLoadingSellers ? (
                <Loader className="h-3 w-3 animate-spin" />
              ) : (
                <div className="h-3 w-3 bg-green-500 rounded-full" />
              )}
              <span>Продавцы</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              {isLoadingBrands ? (
                <Loader className="h-3 w-3 animate-spin" />
              ) : (
                <div className="h-3 w-3 bg-green-500 rounded-full" />
              )}
              <span>Бренды</span>
            </div>
          </div>
        </div>
      </div>
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

  const isFormDisabled = isLoading || !canSubmit;

  return (
    <div className={`space-y-6 ${isMobile ? 'pb-24' : ''}`}>
      <MobileOrderCreationHeader
        title="Создание свободного заказа"
        description="Заполните информацию о заказе"
      />

      {/* Error Alert with Retry */}
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
      
      {/* Оптимизированные поля формы заказа */}
      <OptimizedSellerOrderFormFields
        formData={formData}
        handleInputChange={handleInputChange}
        disabled={isFormDisabled}
      />
      
      {/* Новая секция медиафайлов */}
      <MobileFormSection 
        title="Медиафайлы заказа" 
        icon={<Camera className="h-5 w-5" />}
        defaultOpen={true}
      >
        <div className="space-y-6">
          {/* Кнопки загрузки */}
          <OrderMediaUploadButtons
            images={images}
            videos={videos}
            onImagesUpload={onImagesUpload}
            onVideoUpload={onVideoUpload}
            disabled={isFormDisabled}
            maxImages={25}
            maxVideos={5}
          />

          {/* Компактная галерея всех медиафайлов */}
          <CompactOrderMediaGallery
            images={images}
            videos={videos}
            onImageDelete={onImageDelete}
            onVideoDelete={onVideoDelete}
            onSetPrimaryImage={(url) => {
              // Логика установки главного изображения
              console.log('🌟 Setting primary image:', url);
            }}
            primaryImage={images[0]} // Первое изображение как главное
            disabled={isFormDisabled}
          />
        </div>
      </MobileFormSection>

      {/* Actions */}
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

      {/* Order Preview Dialog */}
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
};
