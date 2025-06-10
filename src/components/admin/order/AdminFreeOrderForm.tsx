
import React from "react";
import { Button } from "@/components/ui/button";
import { MediaUploadSection } from "@/components/admin/order/MediaUploadSection";
import { useOrderFormLogic } from "@/components/admin/order/useOrderFormLogic";
import { OrderFormFields } from "@/components/admin/order/OrderFormFields";
import { CreatedOrderView } from "@/components/admin/order/CreatedOrderView";
import { Loader } from "lucide-react";
import { useForm } from "react-hook-form";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubmissionGuard } from "@/hooks/useSubmissionGuard";
import { toast } from "@/hooks/use-toast";

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
    // New states for progress tracking
    creationStage,
    creationProgress
  } = useOrderFormLogic();

  // Добавляем защиту от дублирующих отправок
  const { guardedSubmit, canSubmit } = useSubmissionGuard({
    timeout: 10000, // Увеличиваем время для создания заказа
    onDuplicateSubmit: () => {
      toast({
        title: "Заказ создается",
        description: "Пожалуйста подождите, заказ уже создается",
        variant: "destructive",
      });
    }
  });

  // Create form instance for shadcn/ui Form component
  const form = useForm();

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

  // Обработчик для данных из товара
  const handleDataFromProduct = (productData: any) => {
    console.log("Product data received:", productData);
    // Дополнительная обработка, если нужна
  };

  // Защищенный обработчик отправки формы
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

  // Instead of using the shadcn Form component with required form props,
  // we'll use a regular form element since we're managing form state
  // with our custom hook
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <OrderFormFields
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
