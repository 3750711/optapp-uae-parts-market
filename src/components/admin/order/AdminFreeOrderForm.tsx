
import React from 'react';
import { useAdminOrderFormLogic } from '@/hooks/useAdminOrderFormLogic';
import { SellerOrderFormFields } from './SellerOrderFormFields';
import SimpleMediaSection from './SimpleMediaSection';
import { CreatedOrderView } from './CreatedOrderView';
import { EnhancedInitializationState } from './EnhancedInitializationState';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';
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
    
    // Enhanced initialization
    isInitializing,
    initializationError,
    hasAdminAccess,
    initializationStage,
    initializationProgress,
    forceComplete,
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

  // Protected form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    guardedSubmit(async () => {
      await originalHandleSubmit(e);
    });
  };

  // Handle retry initialization
  const handleRetry = () => {
    window.location.reload();
  };

  // Handle back navigation
  const handleBack = () => {
    navigate('/admin/dashboard');
  };

  // Enhanced initialization state with better UX
  if (isInitializing || initializationError) {
    return (
      <EnhancedInitializationState
        isInitializing={isInitializing}
        initializationError={initializationError}
        initializationStage={initializationStage}
        initializationProgress={initializationProgress}
        onForceComplete={forceComplete}
        onBack={handleBack}
        onRetry={handleRetry}
      />
    );
  }

  // Access denied state (backup - should be handled in initialization)
  if (!hasAdminAccess) {
    return (
      <EnhancedInitializationState
        isInitializing={false}
        initializationError="У вас нет прав администратора для создания заказов"
        initializationStage="access_denied"
        initializationProgress={100}
        onForceComplete={forceComplete}
        onBack={handleBack}
        onRetry={handleRetry}
      />
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
