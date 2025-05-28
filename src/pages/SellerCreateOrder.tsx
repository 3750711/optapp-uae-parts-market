
import React, { useState, useMemo } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { OrderConfirmationCard } from "@/components/order/OrderConfirmationCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { Save } from "lucide-react";
import FormProgressIndicator from "@/components/ui/FormProgressIndicator";

// Import new components and hooks
import { useOrderForm } from "@/hooks/useOrderForm";
import { useOrderSubmission } from "@/hooks/useOrderSubmission";
import { useProductData } from "@/hooks/useProductData";
import BasicInfoStep from "@/components/order/form/BasicInfoStep";
import PriceAndBuyerStep from "@/components/order/form/PriceAndBuyerStep";
import AdditionalInfoStep from "@/components/order/form/AdditionalInfoStep";
import OrderFormNavigation from "@/components/order/form/OrderFormNavigation";
import OrderFormActions from "@/components/order/form/OrderFormActions";

const SellerCreateOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  const isMobile = useIsMobile();
  
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Use custom hooks for form logic
  const {
    formData,
    images,
    videos,
    touchedFields,
    isSubmitting,
    canSubmit,
    hasUnsavedChanges,
    isFieldValid,
    getFieldError,
    handleInputChange,
    handleImageUpload,
    handleImageDelete,
    setImages,
    setVideos,
    guardedSubmit,
    resetForm,
  } = useOrderForm({ productId });

  const { submitOrder } = useOrderSubmission({
    productId,
    onOrderCreated: setCreatedOrder
  });

  // Load product data if productId exists
  useProductData({
    productId,
    onDataLoaded: (data) => {
      Object.entries(data).forEach(([key, value]) => {
        if (value) {
          handleInputChange(key, value);
        }
      });
    }
  });

  // Swipe navigation for mobile
  const swipeRef = useSwipeNavigation({
    onSwipeLeft: () => {
      if (currentStep < 3) setCurrentStep(prev => prev + 1);
    },
    onSwipeRight: () => {
      if (currentStep > 1) setCurrentStep(prev => prev - 1);
    }
  });

  // Form fields for progress calculation
  const formFields = useMemo(() => [
    { name: 'title', label: 'Наименование', required: true, filled: !!formData.title, hasError: !isFieldValid('title') },
    { name: 'price', label: 'Цена', required: true, filled: !!formData.price, hasError: !isFieldValid('price') },
    { name: 'buyerOptId', label: 'Покупатель', required: true, filled: !!formData.buyerOptId, hasError: !isFieldValid('buyerOptId') },
    { name: 'brand', label: 'Бренд', required: false, filled: !!formData.brand },
    { name: 'model', label: 'Модель', required: false, filled: !!formData.model },
    { name: 'delivery_price', label: 'Доставка', required: false, filled: !!formData.delivery_price },
  ], [formData, isFieldValid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await guardedSubmit(async () => {
      await submitOrder(formData, images, videos);
    });
  };

  const handleOrderUpdate = (updatedOrder: any) => {
    setCreatedOrder(updatedOrder);
  };

  const handleNewOrder = () => {
    setCreatedOrder(null);
    resetForm();
  };

  if (createdOrder) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => navigate('/seller/dashboard')}
              className="mr-4 min-h-[44px]"
            >
              Вернуться в панель
            </Button>
            <Button 
              onClick={handleNewOrder}
              className="min-h-[44px]"
            >
              Создать новый заказ
            </Button>
          </div>
          <OrderConfirmationCard 
            order={createdOrder} 
            images={images}
            onOrderUpdate={handleOrderUpdate}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8" ref={swipeRef}>
        <div className={`max-w-4xl mx-auto ${isMobile ? 'pb-24' : ''}`}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={isMobile ? "text-xl" : ""}>Информация о заказе</CardTitle>
                  <CardDescription>
                    Заполните необходимые поля для создания нового заказа
                  </CardDescription>
                </div>
                {hasUnsavedChanges && (
                  <div className="flex items-center text-orange-600 text-sm">
                    <Save className="h-4 w-4 mr-1" />
                    Автосохранение активно
                  </div>
                )}
              </div>
              
              {isMobile && (
                <div className="mt-4">
                  <FormProgressIndicator fields={formFields} />
                </div>
              )}
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {/* Step 1: Basic Info */}
                {(!isMobile || currentStep === 1) && (
                  <BasicInfoStep
                    formData={formData}
                    touchedFields={touchedFields}
                    onInputChange={handleInputChange}
                    isFieldValid={isFieldValid}
                    getFieldError={getFieldError}
                    isMobile={isMobile}
                  />
                )}

                {/* Step 2: Price and Buyer */}
                {(!isMobile || currentStep === 2) && (
                  <PriceAndBuyerStep
                    formData={formData}
                    touchedFields={touchedFields}
                    onInputChange={handleInputChange}
                    isFieldValid={isFieldValid}
                    getFieldError={getFieldError}
                    isMobile={isMobile}
                  />
                )}

                {/* Step 3: Additional Info */}
                {(!isMobile || currentStep === 3) && (
                  <AdditionalInfoStep
                    formData={formData}
                    images={images}
                    videos={videos}
                    onInputChange={handleInputChange}
                    onImageUpload={handleImageUpload}
                    onImageDelete={handleImageDelete}
                    setVideos={setVideos}
                  />
                )}
              </CardContent>
              
              <CardFooter>
                <OrderFormActions
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                  canSubmit={canSubmit}
                  isMobile={isMobile}
                />
              </CardFooter>
            </form>
          </Card>
          
          {!isMobile && (
            <div className="mt-6">
              <FormProgressIndicator fields={formFields} />
            </div>
          )}
        </div>
      </div>
      
      <OrderFormNavigation
        currentStep={currentStep}
        totalSteps={3}
        onStepChange={setCurrentStep}
        isMobile={isMobile}
      />
    </Layout>
  );
};

export default SellerCreateOrder;
