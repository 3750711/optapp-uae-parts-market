import React, { useState, useEffect } from 'react';
import { useAdminFreeOrderSubmission } from '@/hooks/admin-order/useAdminFreeOrderSubmission';
import { useAdminOrderFormLogic } from '@/hooks/useAdminOrderFormLogic';
import OptimizedSellerOrderFormFields from './OptimizedSellerOrderFormFields';
import SimplePhotoUploader from '@/components/uploader/SimplePhotoUploader';
import { CloudinaryVideoUpload } from '@/components/ui/cloudinary-video-upload';
import { CreatedOrderView } from './CreatedOrderView';
import { TelegramOrderParser } from './TelegramOrderParser';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader, AlertCircle, Plus, RefreshCw, Database, X } from 'lucide-react';
import { useSubmissionGuard } from '@/hooks/useSubmissionGuard';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileOrderCreationHeader } from './MobileOrderCreationHeader';
import { MobileFormSection } from './MobileFormSection';
import { ParsedTelegramOrder } from '@/utils/parseTelegramOrder';

export const AdminFreeOrderForm = () => {
  const isMobile = useIsMobile();

  // Use the specialized submission hook for free orders
  const {
    isLoading: submissionLoading,
    stage,
    createdOrder: submittedOrder,
    error: submissionError,
    handleSubmit: submitOrder,
    resetCreatedOrder,
    clearError: clearSubmissionError,
  } = useAdminFreeOrderSubmission();

  // Use existing admin form logic for data management
  const {
    // Admin access
    hasAdminAccess,
    isCheckingAdmin,
    
    // Form data
    formData,
    handleInputChange,
    images,
    videos,
    setAllImages,
    setVideos,
    
    // Additional data
    buyerProfiles,
    sellerProfiles,
    isLoadingBuyers,
    isLoadingSellers,
    enableBuyersLoading,
    enableSellersLoading,
    
    // Car data
    brands,
    models,
    isLoadingBrands,
    isLoadingModels,
    selectBrand,
    enableBrandsLoading,
    findBrandNameById,
    findModelNameById,
    findBrandIdByName,
    findModelIdByNameDirect,
    
    // Loading states and other utilities
    isInitializing: formInitializing,
    resetForm,
  } = useAdminOrderFormLogic();

  // Combine states - prioritize submission hook for order creation flow
  const createdOrder = submittedOrder;
  const error = submissionError;
  const isLoading = submissionLoading;
  const isInitializing = formInitializing;

  // Initialize data loading when admin access is confirmed
  useEffect(() => {
    if (hasAdminAccess) {
      enableBuyersLoading();
      enableSellersLoading();
      enableBrandsLoading();
    }
  }, [hasAdminAccess, enableBuyersLoading, enableSellersLoading, enableBrandsLoading]);

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

  // Handle image uploads with SimplePhotoUploader format
  const onImagesUpload = (completedUrls: string[]) => {
    console.log('📸 Images uploaded:', completedUrls);
    // SimplePhotoUploader onChange gives us completed URLs
    setAllImages(completedUrls);
  };

  const onVideoUpload = (urls: string[]) => {
    setVideos(prev => [...prev, ...urls]);
  };

  const onVideoDelete = (url: string) => {
    setVideos(prev => prev.filter(video => video !== url));
  };

  const handleTelegramDataParsed = async (data: ParsedTelegramOrder) => {
    console.log('📝 Применение данных из Telegram:', data);
    
    // Fill basic fields using the existing handleInputChange
    handleInputChange('title', data.title);
    handleInputChange('place_number', data.place_number);
    handleInputChange('price', data.price);
    handleInputChange('buyerOptId', data.buyerOptId);
    
    if (data.delivery_price) {
      handleInputChange('delivery_price', data.delivery_price);
    }

    // Find and set seller
    const foundSeller = sellerProfiles.find(seller => seller.opt_id === data.sellerOptId);
    if (foundSeller) {
      handleInputChange('sellerId', foundSeller.id);
      console.log('✅ Найден продавец:', foundSeller.opt_id);
    } else {
      toast({
        title: "Продавец не найден",
        description: `Продавец с OPT_ID "${data.sellerOptId}" не найден в системе`,
        variant: "destructive",
      });
    }

    // Find and set brand/model
    let brandId: string | null = null;
    if (data.brand) {
      brandId = findBrandIdByName(data.brand);
      if (brandId) {
        handleInputChange('brandId', brandId);
        handleInputChange('brand', data.brand);
        selectBrand(brandId);
      } else {
        handleInputChange('brand', data.brand);
      }
    }

    if (data.model && brandId) {
      try {
        const modelId = await findModelIdByNameDirect(data.model, brandId);
        if (modelId) {
          handleInputChange('modelId', modelId);
          handleInputChange('model', data.model);
        } else {
          handleInputChange('model', data.model);
        }
      } catch (error) {
        console.error('Error finding model:', error);
        handleInputChange('model', data.model);
      }
    }

    toast({
      title: "Поля заполнены",
      description: "Данные из Telegram применены",
    });
  };

  const handleCreateOrderClick = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title || formData.price === undefined || formData.price === null || formData.price === '' || !formData.sellerId || !formData.buyerOptId || !formData.brandId) {
      toast({
        title: "Заполните обязательные поля",
        description: "Необходимо заполнить название, цену, бренд, продавца и OPT_ID покупателя",
        variant: "destructive",
      });
      return;
    }

    guardedSubmit(async () => {
      await submitOrder(formData, images, videos);
    });
  };

  const resetFormAndClearState = () => {
    resetForm();
    resetCreatedOrder();
  };

  const getBuyerProfile = () => {
    return buyerProfiles.find(buyer => buyer.opt_id === formData.buyerOptId) || null;
  };

  const selectedSeller = sellerProfiles.find(s => s.id === formData.sellerId) || null;

  const clearError = () => {
    clearSubmissionError();
  };

  // Loading states
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
        onNewOrder={resetFormAndClearState}
        onOrderUpdate={() => {}}
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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={clearError}
              className="ml-2"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <TelegramOrderParser 
            onDataParsed={handleTelegramDataParsed}
            disabled={isFormDisabled}
          />
        </CardContent>
      </Card>

      <MobileFormSection title="Информация о заказе">
        <OptimizedSellerOrderFormFields
          formData={formData}
          handleInputChange={handleInputChange}
          disabled={isFormDisabled}
          sellerProfiles={sellerProfiles}
          buyerProfiles={buyerProfiles}
          brands={brands}
          models={models}
          isLoadingBrands={isLoadingBrands}
          isLoadingModels={isLoadingModels}
          isLoadingBuyers={isLoadingBuyers}
          isLoadingSellers={isLoadingSellers}
          enableBrandsLoading={enableBrandsLoading}
          enableBuyersLoading={enableBuyersLoading}
          enableSellersLoading={enableSellersLoading}
          selectBrand={selectBrand}
          findBrandNameById={findBrandNameById}
          findModelNameById={findModelNameById}
        />
      </MobileFormSection>

      <MobileFormSection title="Изображения">
        <SimplePhotoUploader
          onChange={onImagesUpload}
          max={50}
          language="ru"
          buttonText="Загрузить изображения"
        />
      </MobileFormSection>

      <MobileFormSection title="Видео">
        <CloudinaryVideoUpload
          videos={videos}
          onUpload={onVideoUpload}
          onDelete={onVideoDelete}
          disabled={isFormDisabled}
          maxVideos={3}
        />
      </MobileFormSection>

      <div className={`${isMobile ? 'fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-50' : 'flex justify-end'}`}>
        <Button
          onClick={handleCreateOrderClick}
          disabled={isFormDisabled}
          className="w-full md:w-auto"
        >
          {isLoading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              {stage || 'Создание заказа...'}
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Создать заказ
            </>
          )}
        </Button>
      </div>
    </div>
  );
};