
import React from 'react';
import { useAdminOrderFormLogic } from '@/hooks/useAdminOrderFormLogic';
import { SellerOrderFormFields } from './SellerOrderFormFields';
import SimpleMediaSection from './SimpleMediaSection';
import { CreatedOrderView } from './CreatedOrderView';
import { Button } from '@/components/ui/button';
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
    setAllImages,
    
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
    setAllImages(urls);
  };

  // Protected form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    guardedSubmit(async () => {
      await originalHandleSubmit(e);
    });
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
      
      {/* Simple Media Upload Section */}
      <SimpleMediaSection
        images={images}
        onImagesUpload={onImagesUpload}
        disabled={isFormDisabled}
        maxImages={25}
      />

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
