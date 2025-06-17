
import React, { useState } from 'react';
import { useAdminOrderFormLogic } from '@/hooks/useAdminOrderFormLogic';
import SellerOrderFormFields from './SellerOrderFormFields';
import AdvancedImageUpload from './AdvancedImageUpload';
import { CloudinaryVideoUpload } from '@/components/ui/cloudinary-video-upload';
import { CreatedOrderView } from './CreatedOrderView';
import { OrderPreviewDialog } from './OrderPreviewDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader, AlertCircle, Camera, Plus } from 'lucide-react';
import { useSubmissionGuard } from '@/hooks/useSubmissionGuard';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileOrderCreationHeader } from './MobileOrderCreationHeader';
import { MobileFormSection } from './MobileFormSection';
import { MobileStickyActions } from './MobileStickyActions';

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
    buyerProfiles,
    sellerProfiles,
    selectedSeller,
    brands,
    brandModels,
    isLoadingCarData,
    searchBrandTerm,
    setSearchBrandTerm,
    searchModelTerm,
    setSearchModelTerm,
    filteredBrands,
    filteredModels,
    handleBrandChange,
    handleModelChange,
    isLoading,
    createdOrder,
    handleSubmit: originalHandleSubmit,
    handleOrderUpdate,
    resetForm,
    parseTitleForBrand,
    isInitializing,
    initializationError,
    hasAdminAccess,
    navigate
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

  // Simplified loading state
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка данных для создания заказа...</p>
        </div>
      </div>
    );
  }

  if (initializationError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {initializationError}
          <div className="mt-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Попробовать снова
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (!hasAdminAccess) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          У вас нет прав администратора для создания заказов
          <div className="mt-2">
            <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
              Вернуться в панель
            </Button>
          </div>
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
      
      {/* Order Form Fields - всегда открыто */}
      <SellerOrderFormFields
        formData={formData}
        handleInputChange={handleInputChange}
        buyerProfiles={buyerProfiles}
        sellerProfiles={sellerProfiles}
        selectedSeller={selectedSeller}
        brands={brands}
        brandModels={brandModels}
        isLoadingCarData={isLoadingCarData}
        searchBrandTerm={searchBrandTerm}
        setSearchBrandTerm={setSearchBrandTerm}
        searchModelTerm={searchModelTerm}
        setSearchModelTerm={setSearchModelTerm}
        filteredBrands={filteredBrands}
        filteredModels={filteredModels}
        handleBrandChange={handleBrandChange}
        handleModelChange={handleModelChange}
        parseTitleForBrand={parseTitleForBrand}
        onImagesUpload={onImagesUpload}
        onDataFromProduct={() => {}}
        disabled={isFormDisabled}
      />
      
      {/* Media Upload Section - всегда открыто */}
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

      {/* Actions для мобильных и десктопа */}
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
