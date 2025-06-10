
import React, { useState, useMemo } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { OrderConfirmationCard } from "@/components/order/OrderConfirmationCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { Save, ArrowLeft, Package } from "lucide-react";

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-6 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Заказ создан успешно</h1>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/seller/dashboard')}
                  className="min-h-[44px]"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Вернуться в панель
                </Button>
                <Button 
                  onClick={handleNewOrder}
                  className="min-h-[44px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Создать новый заказ
                </Button>
              </div>
            </div>
            <OrderConfirmationCard 
              order={createdOrder} 
              images={images}
              videos={videos}
              onOrderUpdate={handleOrderUpdate}
            />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Создание заказа</h1>
                  <p className="text-gray-600">Заполните информацию о заказе для отправки</p>
                </div>
              </div>
              
              {hasUnsavedChanges && (
                <div className="flex items-center gap-2 text-orange-600 text-sm bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                  <Save className="h-4 w-4" />
                  <span>Изменения автоматически сохраняются</span>
                </div>
              )}
            </div>

            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className={`flex items-center gap-2 ${isMobile ? "text-xl" : "text-2xl"}`}>
                  <Package className="h-6 w-6" />
                  Информация о заказе
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Укажите детали товара и информацию о получателе
                </CardDescription>
              </CardHeader>
              
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-8 p-8">
                  {/* Основная информация */}
                  <div className="space-y-6">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Основная информация</h3>
                      <p className="text-gray-600 text-sm">Название товара, бренд, модель и цена</p>
                    </div>
                    
                    <BasicOrderInfoStep
                      formData={formData}
                      touchedFields={touchedFields}
                      onInputChange={handleInputChange}
                      isFieldValid={isFieldValid}
                      getFieldError={getFieldError}
                      isMobile={isMobile}
                    />
                  </div>

                  {/* Дополнительная информация */}
                  <div className="space-y-6 border-t pt-8">
                    <div className="border-l-4 border-indigo-500 pl-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Дополнительная информация</h3>
                      <p className="text-gray-600 text-sm">Фотографии, видео и дополнительные детали</p>
                    </div>
                    
                    <AdditionalInfoStep
                      formData={formData}
                      images={images}
                      videos={videos}
                      onInputChange={handleInputChange}
                      onImageUpload={handleImageUpload}
                      onImageDelete={handleImageDelete}
                      onVideoUpload={handleVideoUpload}
                      onVideoDelete={handleVideoDelete}
                    />
                  </div>
                </CardContent>
                
                <CardFooter className="bg-gray-50 border-t rounded-b-lg p-8">
                  <div className="flex justify-between items-center w-full">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/seller/dashboard')}
                      disabled={isSubmitting}
                      className={`${isMobile ? "min-h-[44px]" : ""} hover:bg-gray-100`}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Отмена
                    </Button>
                    
                    <div className="flex items-center gap-4">
                      {hasUnsavedChanges && (
                        <span className="text-sm text-gray-500 hidden md:block">
                          Изменения сохраняются автоматически
                        </span>
                      )}
                      <Button
                        type="submit"
                        disabled={isSubmitting || !canSubmit}
                        className={`${isMobile ? "min-h-[44px]" : ""} bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8`}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Создание...
                          </>
                        ) : (
                          <>
                            <Package className="h-4 w-4 mr-2" />
                            Создать заказ
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SellerCreateOrder;
