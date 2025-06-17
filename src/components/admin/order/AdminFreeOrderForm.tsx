import React, { useState } from 'react';
import { useAdminOrderFormLogic } from '@/hooks/useAdminOrderFormLogic';
import SellerOrderFormFields from './SellerOrderFormFields';
import AdvancedImageUpload from './AdvancedImageUpload';
import { CloudinaryVideoUpload } from '@/components/ui/cloudinary-video-upload';
import { CreatedOrderView } from './CreatedOrderView';
import { OrderPreviewDialog } from './OrderPreviewDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, AlertCircle } from 'lucide-react';
import { useSubmissionGuard } from '@/hooks/useSubmissionGuard';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const AdminFreeOrderForm = () => {
  const [showPreview, setShowPreview] = useState(false);

  const {
    // Form data
    formData,
    handleInputChange,
    
    // Media
    images,
    videos,
    setAllImages,
    setVideos,
    
    // Profiles and car data
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
    
    // Order creation
    isLoading,
    createdOrder,
    handleSubmit: originalHandleSubmit,
    handleOrderUpdate,
    resetForm,
    
    // Utils
    parseTitleForBrand,
    
    // Simplified initialization
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

  // Handle media upload for orders
  const onImagesUpload = (urls: string[]) => {
    console.log('📸 AdminFreeOrderForm: New images uploaded:', urls);
    setAllImages(urls);
  };

  // Handle image deletion
  const onImageDelete = (url: string) => {
    console.log('🗑️ AdminFreeOrderForm: Image deleted:', url);
    const newImages = images.filter(img => img !== url);
    setAllImages(newImages);
  };

  // Handle video upload
  const onVideoUpload = (urls: string[]) => {
    console.log('📹 AdminFreeOrderForm: New videos uploaded:', urls);
    setVideos(prev => [...prev, ...urls]);
  };

  // Handle video deletion
  const onVideoDelete = (url: string) => {
    console.log('🗑️ AdminFreeOrderForm: Video deleted:', url);
    setVideos(prev => prev.filter(video => video !== url));
  };

  // Show preview when "Create Order" is clicked
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

  // Confirm order creation from preview
  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPreview(false);
    guardedSubmit(async () => {
      await originalHandleSubmit(e);
    });
  };

  // Go back to editing from preview
  const handleBackToEdit = () => {
    setShowPreview(false);
  };

  // Validate form for preview - исправляем проверку полей
  const canShowPreview = () => {
    const isValid = formData.title && 
                   formData.price && 
                   formData.sellerId && 
                   formData.buyerOptId; // Используем buyerOptId вместо buyerId
    
    console.log('🔍 Form validation result:', {
      title: !!formData.title,
      price: !!formData.price,
      sellerId: !!formData.sellerId,
      buyerOptId: !!formData.buyerOptId,
      isValid: isValid
    });
    
    return isValid;
  };

  // Get buyer profile for preview
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

  // Simplified error state
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

  // Access denied state
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

  // Show created order view
  if (createdOrder) {
    return (
      <CreatedOrderView
        order={createdOrder}
        images={images}
        videos={videos}
        onBack={() => navigate('/admin/dashboard')}
        onNewOrder={resetForm}
        onOrderUpdate={handleOrderUpdate}
      />
    );
  }

  const isFormDisabled = isLoading || !canSubmit;

  return (
    <div className="space-y-8">
      {/* Order Form Fields */}
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
        onDataFromProduct={() => {}} // Not used in free orders
        disabled={isFormDisabled}
      />
      
      {/* Media Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Медиафайлы заказа</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Upload */}
          <div>
            <h3 className="text-lg font-medium mb-4">Изображения</h3>
            <AdvancedImageUpload
              images={images}
              onImagesUpload={onImagesUpload}
              onImageDelete={onImageDelete}
              onSetPrimaryImage={() => {}} // Not used for orders
              disabled={isFormDisabled}
              maxImages={25}
            />
          </div>

          {/* Video Upload */}
          <div>
            <h3 className="text-lg font-medium mb-4">Видео</h3>
            <CloudinaryVideoUpload
              videos={videos}
              onUpload={onVideoUpload}
              onDelete={onVideoDelete}
              maxVideos={5}
              disabled={isFormDisabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end pt-6 border-t">
        <Button
          type="button"
          onClick={handleCreateOrderClick}
          disabled={isFormDisabled}
          size="lg"
          className="min-w-[200px]"
        >
          Создать заказ
        </Button>
      </div>

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
