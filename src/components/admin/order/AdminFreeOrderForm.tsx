import React from "react";
import { Button } from "@/components/ui/button";
import { MediaUploadSection } from "@/components/admin/order/MediaUploadSection";
import { useOrderFormLogic } from "@/components/admin/order/useOrderFormLogic";
import { SellerOrderFormFields } from "@/components/admin/order/SellerOrderFormFields";
import { CreatedOrderView } from "@/components/admin/order/CreatedOrderView";
import { Loader, AlertCircle, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubmissionGuard } from "@/hooks/useSubmissionGuard";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const AdminFreeOrderForm = () => {
  const {
    formData,
    images,
    videos,
    buyerProfiles,
    sellerProfiles,
    selectedSeller,
    isLoading,
    createdOrder,
    brands,
    brandModels,
    isLoadingCarData,
    searchBrandTerm,
    setSearchBrandTerm,
    searchModelTerm,
    setSearchModelTerm,
    filteredBrands,
    filteredModels,
    setImages,
    setVideos,
    handleInputChange,
    handleImageUpload,
    handleOrderUpdate,
    handleSubmit: originalHandleSubmit,
    resetForm,
    navigate,
    parseTitleForBrand,
    creationStage,
    creationProgress,
    // New initialization states
    isInitializing,
    initializationError,
    hasAdminAccess
  } = useOrderFormLogic();

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

  const form = useForm();

  // Show initialization error
  if (initializationError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка инициализации</AlertTitle>
          <AlertDescription>{initializationError}</AlertDescription>
        </Alert>
        <Button 
          onClick={() => navigate('/admin/dashboard')}
          variant="outline"
          className="w-full"
        >
          Вернуться в панель администратора
        </Button>
      </div>
    );
  }

  // Show loading skeleton during initialization
  if (isInitializing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Loader className="h-4 w-4 animate-spin" />
          <span className="text-sm text-gray-600">Загрузка данных...</span>
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!hasAdminAccess) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertTitle>Доступ запрещен</AlertTitle>
          <AlertDescription>
            У вас нет прав для доступа к этой странице. Обратитесь к администратору.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => navigate('/profile')}
          variant="outline"
          className="w-full"
        >
          Вернуться в профиль
        </Button>
      </div>
    );
  }

  const onImagesUpload = (urls: string[]) => {
    handleImageUpload(urls);
  };

  const onVideoUpload = (urls: string[]) => {
    setVideos((prev) => [...prev, ...urls]);
  };

  const onVideoDelete = (url: string) => {
    setVideos((prev) => prev.filter((v) => v !== url));
  };

  const handleGoBack = () => {
    navigate('/admin/dashboard');
  };

  const handleDataFromProduct = (productData: any) => {
    console.log("Product data received:", productData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    guardedSubmit(async () => {
      await originalHandleSubmit(e);
    });
  };
  
  const getStageMessage = () => {
    switch (creationStage) {
      case 'validating':
        return 'Проверка данных формы...';
      case 'fetching_buyer':
        return 'Поиск профиля покупателя...';
      case 'creating_order':
        return 'Создание заказа в базе данных...';
      case 'fetching_order':
        return 'Получение данных созданного заказа...';
      case 'saving_videos':
        return 'Сохранение видео...';
      case 'sending_notification':
        return 'Отправка уведомления...';
      case 'completed':
        return 'Заказ успешно создан!';
      default:
        return 'Создание заказа...';
    }
  };

  const isFormDisabled = isLoading || !canSubmit;

  if (createdOrder) {
    return (
      <CreatedOrderView
        order={createdOrder}
        images={images}
        onBack={handleGoBack}
        onNewOrder={resetForm}
        onOrderUpdate={handleOrderUpdate}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        onDataFromProduct={handleDataFromProduct}
        disabled={isFormDisabled}
      />
      
      <MediaUploadSection 
        images={images}
        videos={videos}
        onImagesUpload={onImagesUpload}
        onVideoUpload={onVideoUpload}
        onVideoDelete={onVideoDelete}
        disabled={isFormDisabled}
      />
      
      <div className="flex flex-col space-y-4">
        {isLoading && (
          <div className="border rounded-md p-4 bg-gray-50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                <span className="font-medium">{getStageMessage()}</span>
              </div>
              <span className="text-sm text-gray-500">{creationProgress}%</span>
            </div>
            <Progress value={creationProgress} className="h-2" />
            {creationStage === 'completed' && (
              <div className="text-sm text-gray-600">
                Уведомление в Telegram будет отправлено в фоновом режиме.
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={isFormDisabled} className="w-full md:w-auto">
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
    </form>
  );
};
