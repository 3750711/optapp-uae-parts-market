
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { OrderFormFields } from "./OrderFormFields";
import { MediaUploadSection } from "./MediaUploadSection";
import { CreatedOrderView } from "./CreatedOrderView";
import { useOrderFormLogic } from "./useOrderFormLogic";

export const AdminFreeOrderForm = () => {
  const { user } = useAuth();
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
    handleSubmit,
    resetForm,
    navigate,
    parseTitleForBrand, // Add the new function
  } = useOrderFormLogic();

  if (createdOrder) {
    return (
      <CreatedOrderView
        order={createdOrder}
        images={images}
        onBack={() => navigate('/admin')}
        onNewOrder={resetForm}
        onOrderUpdate={handleOrderUpdate}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Информация о свободном заказе</CardTitle>
            <CardDescription>
              Заполните необходимые поля для создания нового заказа
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
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
                parseTitleForBrand={parseTitleForBrand} // Pass the new function
              />
              
              <MediaUploadSection
                images={images}
                videos={videos}
                onImagesUpload={handleImageUpload}
                onVideoUpload={(urls) => setVideos((prev) => [...prev, ...urls])}
                onVideoDelete={(url) => setVideos((prev) => prev.filter(u => u !== url))}
              />
            </CardContent>
            <CardFooter className="flex justify-end space-x-4">
              <Button 
                variant="outline" 
                type="button"
                onClick={() => navigate('/admin')}
              >
                Отмена
              </Button>
              <Button 
                type="submit"
                className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Создание...
                  </>
                ) : (
                  'Создать заказ'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
