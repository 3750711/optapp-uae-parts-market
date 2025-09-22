import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import AdminAddProductForm from "@/components/admin/AdminAddProductForm";
import { useOptimizedAdminAddProduct } from "@/hooks/useOptimizedAdminAddProduct";
import ProductPreviewDialog from "@/components/admin/ProductPreviewDialog";
import ProductCreationProgress from "@/components/admin/ProductCreationProgress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { TrustedSellerIndicator } from "./TrustedSellerIndicator";

interface TrustedSellerFormProps {
  mode?: 'trusted_seller';
}

const TrustedSellerForm: React.FC<TrustedSellerFormProps> = ({ mode = 'trusted_seller' }) => {
  const { user } = useAuth();
  
  const {
    form,
    onSubmit,
    isSubmitting,
    imageUrls,
    videoUrls,
    setVideoUrls,
    primaryImage,
    setPrimaryImage,
    sellers,
    brands,
    brandModels,
    isLoadingCarData,
    handleMobileOptimizedImageUpload,
    handleImageDelete,
    isPreviewOpen,
    closePreview,
    richPreviewData,
    handleConfirmPublish,
    isPublished,
    resetFormAndState,
    progressSteps,
    totalProgress,
  } = useOptimizedAdminAddProduct({ 
    mode: 'trusted_seller',
    sellerId: user?.id 
  });

  // Форма теперь автоматически настраивается для доверенных продавцов через хук

  const handleRefreshPage = () => {
    window.location.reload();
  };

  if (isPublished) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-green-600">
            Товар успешно опубликован!
          </CardTitle>
          <CardDescription>
            Для создания нового товара необходимо обновить страницу
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleRefreshPage}
              size="lg" 
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Обновить страницу
            </Button>
            <Button 
              onClick={resetFormAndState}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Очистить данные без обновления
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Обновление страницы гарантирует полную очистку всех данных и корректную работу формы
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <TrustedSellerIndicator />
      
      {/* Progress indicator during submission */}
      {(isSubmitting || totalProgress > 0) && (
        <ProductCreationProgress
          steps={progressSteps}
          totalProgress={totalProgress}
        />
      )}
      
      <AdminAddProductForm
        form={form}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        imageUrls={imageUrls}
        videoUrls={videoUrls}
        setVideoUrls={setVideoUrls}
        handleMobileOptimizedImageUpload={handleMobileOptimizedImageUpload}
        primaryImage={primaryImage}
        setPrimaryImage={setPrimaryImage}
        onImageDelete={handleImageDelete}
        sellers={sellers}
        brands={brands}
        brandModels={brandModels}
        isLoadingCarData={isLoadingCarData}
        mode={mode}
      />
      
      <ProductPreviewDialog
        isOpen={isPreviewOpen}
        onClose={closePreview}
        onConfirm={handleConfirmPublish}
        productData={richPreviewData}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default TrustedSellerForm;