
import React from 'react';
import { useAdminOrderFormLogic } from '@/hooks/useAdminOrderFormLogic';
import { SellerOrderFormFields } from './SellerOrderFormFields';
import OptimizedOrderMediaSection from './OptimizedOrderMediaSection';
import { CreatedOrderView } from './CreatedOrderView';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useSubmissionGuard } from '@/hooks/useSubmissionGuard';
import { toast } from '@/hooks/use-toast';

export const AdminFreeOrderForm = () => {
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
    
    // Order creation
    isLoading,
    createdOrder,
    handleSubmit: originalHandleSubmit,
    handleOrderUpdate,
    resetForm,
    
    // Utils
    parseTitleForBrand,
    
    // Progress tracking
    creationStage,
    creationProgress,
    
    // Initialization
    isInitializing,
    initializationError,
    hasAdminAccess
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
    setAllImages([...images, ...urls]);
  };

  const onVideoUpload = (urls: string[]) => {
    console.log('🎥 AdminFreeOrderForm: New videos uploaded:', urls);
    setVideos(prev => [...prev, ...urls]);
  };

  const onVideoDelete = (url: string) => {
    console.log('🗑️ AdminFreeOrderForm: Deleting video:', url);
    setVideos(prev => prev.filter(v => v !== url));
  };

  const onImageDelete = (url: string) => {
    console.log('🗑️ AdminFreeOrderForm: Deleting image:', url);
    setAllImages(images.filter(img => img !== url));
  };

  const onSetPrimaryImage = (url: string) => {
    console.log('⭐ AdminFreeOrderForm: Setting primary image:', url);
    // Move the selected image to the first position
    const newImages = [url, ...images.filter(img => img !== url)];
    setAllImages(newImages);
  };

  // Protected form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    guardedSubmit(async () => {
      await originalHandleSubmit(e);
    });
  };

  // Get stage message based on current creation stage
  const getStageMessage = () => {
    switch (creationStage) {
      case 'validating':
        return 'Проверка данных формы...';
      case 'creating_order':
        return 'Создание заказа в базе данных...';
      case 'completed':
        return 'Заказ успешно создан!';
      default:
        return 'Создание заказа...';
    }
  };

  // Loading state during initialization
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <div className="space-y-2">
            <p className="text-lg font-medium">Инициализация формы заказа...</p>
            <p className="text-sm text-gray-600">Проверка прав доступа и загрузка данных</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state during initialization
  if (initializationError) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-red-800">Ошибка инициализации</h3>
                <p className="text-sm text-red-600">{initializationError}</p>
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="w-full"
              >
                Обновить страницу
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access denied state
  if (!hasAdminAccess) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-orange-800">Доступ ограничен</h3>
                <p className="text-sm text-orange-600">
                  У вас нет прав администратора для создания заказов
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show created order view
  if (createdOrder) {
    return (
      <CreatedOrderView
        order={createdOrder}
        images={images}
        onBack={() => window.history.back()}
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
        parseTitleForBrand={parseTitleForBrand}
        onImagesUpload={onImagesUpload}
        onDataFromProduct={() => {}} // Not used in free orders
        disabled={isFormDisabled}
      />
      
      {/* Optimized Media Upload Section */}
      <OptimizedOrderMediaSection
        images={images}
        videos={videos}
        onImagesUpload={onImagesUpload}
        onVideoUpload={onVideoUpload}
        onImageDelete={onImageDelete}
        onVideoDelete={onVideoDelete}
        onSetPrimaryImage={onSetPrimaryImage}
        primaryImage={images[0]} // First image is primary
        orderId={undefined} // No orderId during creation
        disabled={isFormDisabled}
        maxImages={25}
        maxVideos={3}
      />

      {/* Creation Progress */}
      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Loader className="mr-3 h-5 w-5 animate-spin" />
                  <span className="font-medium">{getStageMessage()}</span>
                </div>
                <span className="text-sm text-gray-500">{creationProgress}%</span>
              </div>
              <Progress value={creationProgress} className="h-2" />
              <div className="text-sm text-gray-600">
                Создание заказа может занять несколько секунд...
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Submit Button */}
      <div className="flex justify-end pt-6 border-t">
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isFormDisabled}
          size="lg"
          className="min-w-[200px]"
        >
          {isLoading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Создание заказа...
            </>
          ) : (
            "Создать заказ"
          )}
        </Button>
      </div>
    </div>
  );
};
