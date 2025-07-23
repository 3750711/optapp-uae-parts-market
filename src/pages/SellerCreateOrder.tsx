
import React, { useState, useMemo } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Save, Loader, Eye } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Import seller-specific components and hooks
import { useSellerOrderFormLogic } from "@/hooks/useSellerOrderFormLogic";
import SellerOrderFormFields from "@/components/admin/order/SellerOrderFormFields";
import AdvancedImageUpload from "@/components/admin/order/AdvancedImageUpload";
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
  const [primaryImage, setPrimaryImage] = useState<string>('');

  const {
    formData,
    images,
    videos,
    buyerProfiles,
    isLoading,
    createdOrder,
    setImages,
    setVideos,
    handleInputChange,
    handleImageUpload,
    handleOrderUpdate,
    handleSubmit: originalHandleSubmit,
    resetForm,
    creationStage,
    creationProgress,
    isInitializing
  } = useSellerOrderFormLogic();

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
    console.log('📸 Images uploaded in seller order:', urls);
    setImages(urls);
    
    // Set first image as primary if no primary image is set
    if (!primaryImage && urls.length > 0) {
      setPrimaryImage(urls[0]);
    }
  };

  const onImageDelete = (url: string) => {
    console.log('🗑️ Image deleted in seller order:', url);
    const newImages = images.filter(img => img !== url);
    setImages(newImages);
    
    // Update primary image if deleted image was primary
    if (primaryImage === url) {
      setPrimaryImage(newImages.length > 0 ? newImages[0] : '');
    }
  };

  const onSetPrimaryImage = (url: string) => {
    console.log('⭐ Primary image set in seller order:', url);
    setPrimaryImage(url);
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

  // Show preview when "Create Order" is clicked
  const handleCreateOrderClick = () => {
    console.log('🔍 Checking form validation for seller:', {
      title: formData.title,
      price: formData.price,
      sellerId: formData.sellerId,
      buyerOptId: formData.buyerOptId,
      formData: formData
    });

    if (!canShowPreview()) {
      toast({
        title: "Заполните обязательные поля",
        description: "Необходимо заполнить название, цену и OPT_ID покупателя",
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

  // Validate form for preview - check seller form requirements
  const canShowPreview = () => {
    const isValid = formData.title && 
                   formData.price && 
                   formData.buyerOptId; // Only need buyer OPT_ID for sellers
    
    console.log('🔍 Seller form validation result:', {
      title: !!formData.title,
      price: !!formData.price,
      buyerOptId: !!formData.buyerOptId,
      isValid: isValid
    });
    
    return isValid;
  };

  // Get buyer profile for preview
  const getBuyerProfile = () => {
    return buyerProfiles.find(buyer => buyer.opt_id === formData.buyerOptId) || null;
  };

  // Get seller profile for preview (current user)
  const getSellerProfile = () => {
    return {
      id: user?.id || '',
      full_name: user?.user_metadata?.full_name || 'Текущий пользователь',
      opt_id: user?.user_metadata?.opt_id || ''
    };
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

  // Generate temporary order ID for image uploads
  const temporaryOrderId = useMemo(() => {
    return `temp-seller-${user?.id || 'unknown'}-${Date.now()}`;
  }, [user?.id]);

  const isFormDisabled = isLoading || !canSubmit || isInitializing;

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Создание заказа</CardTitle>
                <CardDescription>Загрузка данных...</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <Loader className="h-8 w-8 animate-spin mr-2" />
                  <span>Загрузка покупателей и брендов...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (createdOrder) {
    return (
      <Layout>
        <CreatedOrderView
          order={createdOrder}
          images={images}
          videos={videos}
          onNewOrder={resetForm}
          onOrderUpdate={handleOrderUpdate}
          buyerProfile={getBuyerProfile()}
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
            
            <CardContent className="space-y-8">
              <SellerOrderFormFields
                formData={formData}
                handleInputChange={handleInputChange}
                disabled={isFormDisabled}
              />
              
              <AdvancedImageUpload
                images={images}
                onImagesUpload={onImagesUpload}
                onImageDelete={onImageDelete}
                onSetPrimaryImage={onSetPrimaryImage}
                primaryImage={primaryImage}
                orderId={temporaryOrderId}
                disabled={isFormDisabled}
                maxImages={25}
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
                    onClick={handleCreateOrderClick}
                    disabled={isFormDisabled}
                    className={isMobile ? "min-h-[44px]" : ""}
                  >
                    Создать заказ
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>

          {/* Order Preview Dialog */}
          <OrderPreviewDialog
            open={showPreview}
            onOpenChange={setShowPreview}
            formData={formData}
            images={images}
            videos={videos}
            selectedSeller={getSellerProfile()}
            buyerProfile={getBuyerProfile()}
            onConfirm={handleConfirmOrder}
            onBack={handleBackToEdit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </Layout>
  );
};

export default SellerCreateOrder;
