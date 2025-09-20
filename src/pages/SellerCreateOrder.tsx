import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Save, Loader, Eye, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Import seller-specific components and hooks
import { useSellerOrderFormLogic } from "@/hooks/useSellerOrderFormLogic";
import SellerOrderFormFields from "@/components/admin/order/SellerOrderFormFields";
import SimplePhotoUploader from "@/components/uploader/SimplePhotoUploader";
import { useStagedCloudinaryUpload } from "@/hooks/useStagedCloudinaryUpload";
import { CloudinaryVideoUpload } from "@/components/ui/cloudinary-video-upload";
import { CreatedOrderView } from "@/components/admin/order/CreatedOrderView";
import { useAuth } from "@/contexts/AuthContext";
import { useSubmissionGuard } from "@/hooks/useSubmissionGuard";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from '@/hooks/useLanguage';
import { getSellerPagesTranslations } from '@/utils/translations/sellerPages';

const SellerCreateOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = getSellerPagesTranslations(language);
  const { attachToOrder } = useStagedCloudinaryUpload();

  const {
    formData,
    images,
    videos,
    buyerProfiles,
    isLoading,
    createdOrder,
    setAllImages,
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
        title: t.orderCreation.duplicateSubmissionTitle,
        description: t.orderCreation.duplicateSubmissionMessage,
        variant: "destructive",
      });
    }
  });

  const onImagesUpload = useCallback((urls: string[]) => {
    console.log('📸 Images uploaded in seller order:', urls);
    setAllImages(urls);
  }, [setAllImages]);

  const onVideoUpload = useCallback((urls: string[]) => {
    setVideos((prev) => [...prev, ...urls]);
  }, [setVideos]);

  const onVideoDelete = useCallback((url: string) => {
    setVideos((prev) => prev.filter((v) => v !== url));
  }, [setVideos]);

  const handleGoBack = () => {
    navigate('/seller/dashboard');
  };

  const handleDataFromProduct = (productData: any) => {
    console.log("Product data received:", productData);
  };

  // Create order directly when button is clicked
  const handleCreateOrderClick = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 Validating seller form:', {
      title: formData.title,
      price: formData.price,
      sellerId: formData.sellerId,
      buyerOptId: formData.buyerOptId
    });

    // Validate required fields
    if (!formData.title || !formData.price || !formData.buyerOptId) {
      toast({
        title: t.orderCreation.fillRequiredFields,
        description: t.orderCreation.fillRequiredFieldsMessage,
        variant: "destructive",
      });
      return;
    }

    guardedSubmit(async () => {
      await originalHandleSubmit(e);
    });
  };

  // Get buyer profile for preview
  const getBuyerProfile = () => {
    return buyerProfiles.find(buyer => buyer.opt_id === formData.buyerOptId) || null;
  };

  // Get seller profile for preview (current user)
  const getSellerProfile = () => {
    return {
      id: user?.id || '',
      full_name: user?.user_metadata?.full_name || 'Current User',
      opt_id: user?.user_metadata?.opt_id || ''
    };
  };

  // Get stage message based on current creation stage
  const getStageMessage = () => {
    switch (creationStage) {
      case 'validating':
        return t.orderCreation.validatingFormData;
      case 'fetching_buyer':
        return t.orderCreation.searchingBuyerProfile;
      case 'creating_order':
        return t.orderCreation.creatingOrderInDatabase;
      case 'fetching_order':
        return t.orderCreation.fetchingCreatedOrderData;
      case 'saving_videos':
        return t.orderCreation.savingVideos;
      case 'sending_notification':
        return t.orderCreation.sendingNotification;
      case 'completed':
        return t.orderCreation.orderCreatedSuccessfully;
      default:
        return t.orderCreation.defaultCreatingMessage;
    }
  };

  // Handle attachment of staged images after order creation
  useEffect(() => {
    if (createdOrder && images.length > 0) {
      attachToOrder(createdOrder.id)
        .then(() => {
          console.log('✅ Staged images attached to order:', createdOrder.id);
        })
        .catch((error) => {
          console.error('❌ Failed to attach staged images:', error);
          toast({
            title: "Предупреждение",
            description: "Заказ создан, но не удалось привязать изображения",
            variant: "destructive",
          });
        });
    }
  }, [createdOrder, attachToOrder, images, toast]);

  const isFormDisabled = isLoading || !canSubmit || isInitializing;

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{t.createOrder}</h1>
            <p className="text-muted-foreground">{t.fillOrderInfo}</p>
          </div>
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.back}
          </Button>
          </div>
          
            <Card>
            <CardHeader>
              <CardTitle>{t.createOrder}</CardTitle>
              <CardDescription>{t.loading}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <Loader className="h-8 w-8 animate-spin mr-2" />
                <span>{t.loading}</span>
              </div>
            </CardContent>
          </Card>
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
        onNewOrder={resetForm}
        onOrderUpdate={handleOrderUpdate}
        buyerProfile={getBuyerProfile()}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{t.createOrder}</h1>
            <p className="text-muted-foreground">{t.fillOrderInfo}</p>
          </div>
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.back}
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={isMobile ? "text-xl" : ""}>{t.createOrder}</CardTitle>
                <CardDescription>
                  {t.fillOrderInfo}
                </CardDescription>
              </div>
              {isLoading && (
                <div className="flex items-center text-orange-600 text-sm">
                  <Save className="h-4 w-4 mr-1" />
                  {t.creatingOrder}
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
            
            <div>
              <h3 className="text-lg font-medium mb-4">{t.media.photos}</h3>
              <SimplePhotoUploader
                onChange={onImagesUpload}
                max={25}
                language={language}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">{t.createOrderForm.videos}</h3>
              <CloudinaryVideoUpload
                videos={videos}
                onUpload={onVideoUpload}
                onDelete={onVideoDelete}
                maxVideos={3}
                productId="temp-seller-video"
                disabled={isFormDisabled}
              />
            </div>
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
                      {t.orderCreation.telegramNotificationBackground}
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
                  {t.cancel}
                </Button>
                <Button
                  type="submit"
                  onClick={handleCreateOrderClick}
                  disabled={isFormDisabled}
                  className={isMobile ? "min-h-[44px]" : ""}
                >
                  {t.createOrder}
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
};

export default SellerCreateOrder;