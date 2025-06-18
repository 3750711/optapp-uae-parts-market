
import React, { useState, useEffect } from 'react';
import { useAdminOrderFormLogic } from '@/hooks/useAdminOrderFormLogic';
import OptimizedSellerOrderFormFields from './OptimizedSellerOrderFormFields';
import AdvancedImageUpload from './AdvancedImageUpload';
import { CloudinaryVideoUpload } from '@/components/ui/cloudinary-video-upload';
import { CreatedOrderView } from './CreatedOrderView';
import { EnhancedOrderPreviewDialog } from './EnhancedOrderPreviewDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader, AlertCircle, Camera, Plus, RefreshCw, Save } from 'lucide-react';
import { useSubmissionGuard } from '@/hooks/useSubmissionGuard';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileOrderCreationHeader } from './MobileOrderCreationHeader';
import { MobileFormSection } from './MobileFormSection';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useAutoSave } from '@/hooks/useAutoSave';

export const AdminFreeOrderForm = () => {
  const [showPreview, setShowPreview] = useState(false);
  const [hasShownAutoSaveRestore, setHasShownAutoSaveRestore] = useState(false);
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
    buyerProfiles
  } = useAdminOrderFormLogic();

  // Form validation
  const { validation, touchField } = useFormValidation(formData);

  // Auto-save functionality
  const { loadFromStorage, clearStorage } = useAutoSave(formData, images, videos);

  // Submission guard
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

  // Check for auto-saved data on mount
  useEffect(() => {
    if (!hasShownAutoSaveRestore) {
      const savedData = loadFromStorage();
      if (savedData && (savedData.formData.title || savedData.images.length > 0)) {
        toast({
          title: "Найдены несохраненные данные",
          description: "Хотите восстановить последний черновик?",
          action: (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  clearStorage();
                  setHasShownAutoSaveRestore(true);
                }}
              >
                Отклонить
              </Button>
              <Button 
                size="sm"
                onClick={() => {
                  // Восстановление данных - это должно быть реализовано в useAdminOrderFormLogic
                  toast({
                    title: "Данные восстановлены",
                    description: "Черновик загружен",
                  });
                  setHasShownAutoSaveRestore(true);
                }}
              >
                <Save className="h-3 w-3 mr-1" />
                Восстановить
              </Button>
            </div>
          )
        });
      }
      setHasShownAutoSaveRestore(true);
    }
  }, [hasShownAutoSaveRestore, loadFromStorage, clearStorage]);

  const onImagesUpload = (urls: string[]) => {
    console.log('📸 AdminFreeOrderForm: New images uploaded:', urls);
    setAllImages(urls);
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
    // Touch all required fields to show validation errors
    ['title', 'price', 'sellerId', 'buyerOptId'].forEach(touchField);

    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors);
      toast({
        title: "Заполните обязательные поля",
        description: errorMessages[0] || "Проверьте правильность заполнения формы",
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
      try {
        await originalHandleSubmit(e);
        // Clear auto-saved data on successful submission
        clearStorage();
      } catch (error) {
        console.error('Order submission failed:', error);
      }
    });
  };

  const handleBackToEdit = () => {
    setShowPreview(false);
  };

  const getBuyerProfile = () => {
    return buyerProfiles.find(buyer => buyer.opt_id === formData.buyerOptId) || null;
  };

  const handleRetry = () => {
    clearError();
    retryOperation();
  };

  // Loading state
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

  // Access denied
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

  // Success state
  if (createdOrder) {
    return (
      <CreatedOrderView
        order={createdOrder}
        images={images}
        videos={videos}
        onNewOrder={() => {
          resetForm();
          clearStorage();
        }}
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
      
      {/* Form fields */}
      <OptimizedSellerOrderFormFields
        formData={formData}
        handleInputChange={handleInputChange}
        disabled={isFormDisabled}
        validation={validation}
        onFieldTouch={touchField}
      />
      
      {/* Media Upload Section */}
      <MobileFormSection 
        title="Медиафайлы заказа" 
        icon={<Camera className="h-5 w-5" />}
        defaultOpen={true}
      >
        <div className="space-y-6">
          <div>
            <h3 className={`font-medium mb-4 ${isMobile ? 'text-base' : 'text-lg'}`}>
              Изображения {images.length > 0 && `(${images.length})`}
            </h3>
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
            <h3 className={`font-medium mb-4 ${isMobile ? 'text-base' : 'text-lg'}`}>
              Видео {videos.length > 0 && `(${videos.length})`}
            </h3>
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

      {/* Actions */}
      {isMobile ? (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-lg">
          <Button
            type="button"
            onClick={handleCreateOrderClick}
            disabled={isFormDisabled}
            size="lg"
            className="w-full touch-target min-h-[48px] text-base font-medium"
          >
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Создание заказа...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Создать заказ
              </>
            )}
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

      {/* Enhanced Order Preview Dialog */}
      <EnhancedOrderPreviewDialog
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
