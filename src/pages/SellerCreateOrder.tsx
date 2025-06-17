import React, { useState, useMemo } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Save, Loader, Eye } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Import admin components and hooks
import { useAdminOrderFormLogic } from "@/hooks/useAdminOrderFormLogic";
import SellerOrderFormFields from "@/components/admin/order/SellerOrderFormFields";
import SimpleMediaSection from "@/components/admin/order/SimpleMediaSection";
import { CreatedOrderView } from "@/components/admin/order/CreatedOrderView";
import { OrderPreviewDialog } from "@/components/admin/order/OrderPreviewDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useSubmissionGuard } from "@/hooks/useSubmissionGuard";
import { toast } from "@/hooks/use-toast";

const SellerCreateOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);

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
    parseTitleForBrand,
    creationStage,
    creationProgress
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

  // Auto-set current user as seller when component mounts
  React.useEffect(() => {
    if (user && user.id && !formData.sellerId) {
      handleInputChange('sellerId', user.id);
    }
  }, [user, formData.sellerId, handleInputChange]);

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
    navigate('/seller/dashboard');
  };

  const handleDataFromProduct = (productData: any) => {
    console.log("Product data received:", productData);
  };

  // Protected form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    guardedSubmit(async () => {
      await originalHandleSubmit(e);
    });
  };

  // Validate form for preview
  const canShowPreview = () => {
    return formData.title && formData.price && formData.sellerId && formData.buyerId;
  };

  // Get buyer profile for preview
  const getBuyerProfile = () => {
    return buyerProfiles.find(buyer => buyer.id === formData.buyerId) || null;
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
      <Layout>
        <CreatedOrderView
          order={createdOrder}
          images={images}
          onBack={handleGoBack}
          onNewOrder={resetForm}
          onOrderUpdate={handleOrderUpdate}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={isMobile ? "text-xl" : ""}>Создание заказа</CardTitle>
                  <CardDescription>
                    Заполните информацию о заказе
                  </CardDescription>
                </div>
                {isLoading && (
                  <div className="flex items-center text-orange-600 text-sm">
                    <Save className="h-4 w-4 mr-1" />
                    Создание заказа
                  </div>
                )}
              </div>
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-8">
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
                
                <SimpleMediaSection 
                  images={images}
                  onImagesUpload={onImagesUpload}
                  disabled={isFormDisabled}
                />
              </CardContent>
              
              <CardFooter>
                <div className="flex flex-col space-y-4 w-full">
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
                  
                  <div className="flex justify-end w-full gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/seller/dashboard')}
                      disabled={isFormDisabled}
                      className={isMobile ? "min-h-[44px]" : ""}
                    >
                      Отмена
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPreview(true)}
                      disabled={isFormDisabled || !canShowPreview()}
                      className={isMobile ? "min-h-[44px]" : ""}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Предпросмотр
                    </Button>
                    <Button
                      type="submit"
                      disabled={isFormDisabled}
                      className={isMobile ? "min-h-[44px]" : ""}
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
              </CardFooter>
            </form>
          </Card>

          {/* Order Preview Dialog */}
          <OrderPreviewDialog
            open={showPreview}
            onOpenChange={setShowPreview}
            formData={formData}
            images={images}
            videos={videos}
            selectedSeller={selectedSeller}
            buyerProfile={getBuyerProfile()}
            onConfirm={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </Layout>
  );
};

export default SellerCreateOrder;
