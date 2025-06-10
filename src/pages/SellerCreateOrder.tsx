
import React, { useState, useMemo } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { OrderConfirmationCard } from "@/components/order/OrderConfirmationCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { Save } from "lucide-react";

// Import new components and hooks
import { useOrderForm } from "@/hooks/useOrderForm";
import { useOrderSubmission } from "@/hooks/useOrderSubmission";
import { useProductData } from "@/hooks/useProductData";
import BasicOrderInfoStep from "@/components/order/form/BasicOrderInfoStep";
import AdditionalInfoStep from "@/components/order/form/AdditionalInfoStep";

const SellerCreateOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  const isMobile = useIsMobile();
  
  const [createdOrder, setCreatedOrder] = useState<any>(null);

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
    handleVideoUpload,
    handleVideoDelete,
    setImages,
    setVideos,
    guardedSubmit,
    resetForm,
    markOrderAsCreated,
  } = useOrderForm({ productId });

  const { submitOrder } = useOrderSubmission({
    productId,
    onOrderCreated: (order) => {
      setCreatedOrder(order);
      markOrderAsCreated(); // Отключаем автосохранение после создания заказа
    }
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
            videos={videos}
            onOrderUpdate={handleOrderUpdate}
          />
        </div>
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
                {hasUnsavedChanges && (
                  <div className="flex items-center text-orange-600 text-sm">
                    <Save className="h-4 w-4 mr-1" />
                    Автосохранение
                  </div>
                )}
              </div>
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-8">
                {/* Основная информация, цена и покупатель - все в одном компоненте */}
                <BasicOrderInfoStep
                  formData={formData}
                  touchedFields={touchedFields}
                  onInputChange={handleInputChange}
                  isFieldValid={isFieldValid}
                  getFieldError={getFieldError}
                  isMobile={isMobile}
                />

                {/* Дополнительная информация */}
                <AdditionalInfoStep
                  formData={formData}
                  images={images}
                  videos={videos}
                  onInputChange={handleInputChange}
                  onImageUpload={handleImageUpload}
                  onImageDelete={handleImageDelete}
                  setVideos={setVideos}
                />
              </CardContent>
              
              <CardFooter>
                <div className="flex justify-end w-full gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/seller/dashboard')}
                    disabled={isSubmitting}
                    className={isMobile ? "min-h-[44px]" : ""}
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !canSubmit}
                    className={isMobile ? "min-h-[44px]" : ""}
                  >
                    {isSubmitting ? "Создание..." : "Создать заказ"}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SellerCreateOrder;
