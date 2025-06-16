
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useAdminOrderFormLogic } from "@/hooks/useAdminOrderFormLogic";
import { OrderBasicInfoTab } from "./OrderBasicInfoTab";
import SimpleOrderMediaSection from "./SimpleOrderMediaSection";
import { CreatedOrderView } from "./CreatedOrderView";
import OrderCreationProgress from "./OrderCreationProgress";

export const AdminFreeOrderForm: React.FC = () => {
  const {
    formData,
    handleInputChange,
    images,
    setAllImages,
    handleSubmit,
    resetForm,
    isLoading,
    createdOrder,
    isInitializing,
    initializationError,
    hasAdminAccess,
    creationStage,
    creationProgress
  } = useAdminOrderFormLogic();

  // Show loading during initialization
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Инициализация формы заказа...</span>
        </div>
      </div>
    );
  }

  // Show error if initialization failed
  if (initializationError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-red-800">Ошибка инициализации</h3>
            <p className="text-red-600">{initializationError}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Обновить страницу
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show access denied if not admin
  if (!hasAdminAccess) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-orange-800">Доступ ограничен</h3>
            <p className="text-orange-600">У вас нет прав для создания заказов</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show created order view if order was successfully created
  if (createdOrder) {
    return <CreatedOrderView 
      order={createdOrder} 
      images={images}
      onBack={resetForm}
      onNewOrder={resetForm}
    />;
  }

  return (
    <div className="space-y-6">
      {/* Creation progress */}
      {isLoading && (
        <OrderCreationProgress currentStep={creationStage} />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic order information */}
        <Card>
          <CardContent className="pt-6">
            <OrderBasicInfoTab 
              form={{ 
                watch: () => ({}),
                control: null,
                formState: { errors: {} }
              }}
              order={formData}
            />
          </CardContent>
        </Card>

        {/* Media upload section */}
        <Card>
          <CardContent className="pt-6">
            <SimpleOrderMediaSection
              images={images}
              onImagesUpload={setAllImages}
              disabled={isLoading}
            />
          </CardContent>
        </Card>

        {/* Form actions */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isLoading || !formData.title || !formData.price || !formData.buyerOptId}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Создание заказа...
              </>
            ) : (
              'Создать заказ'
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={isLoading}
          >
            Очистить форму
          </Button>
        </div>
      </form>
    </div>
  );
};
