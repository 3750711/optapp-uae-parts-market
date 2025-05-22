
import React from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { MediaUploadSection } from "@/components/admin/order/MediaUploadSection";
import { useOrderFormLogic } from "@/components/admin/order/useOrderFormLogic";
import { OrderFormFields } from "@/components/admin/order/OrderFormFields";
import { CreatedOrderView } from "@/components/admin/order/CreatedOrderView";
import { Loader } from "lucide-react";

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
    handleSubmit,
    resetForm,
    navigate,
    parseTitleForBrand
  } = useOrderFormLogic();

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
    <Form>
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
        />
        
        <MediaUploadSection 
          images={images}
          videos={videos}
          onImagesUpload={onImagesUpload}
          onVideoUpload={onVideoUpload}
          onVideoDelete={onVideoDelete}
        />
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
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
      </form>
    </Form>
  );
};
