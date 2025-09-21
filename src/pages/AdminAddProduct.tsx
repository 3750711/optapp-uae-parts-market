
import React from "react";
import { AdminRoute } from "@/components/auth/AdminRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminAddProductForm from "@/components/admin/AdminAddProductForm";
import { useOptimizedAdminAddProduct } from "@/hooks/useOptimizedAdminAddProduct";
import ProductPreviewDialog from "@/components/admin/ProductPreviewDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import ProductCreationProgress from "@/components/admin/ProductCreationProgress";


const AdminAddProduct = () => {
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
  } = useOptimizedAdminAddProduct();

  const handleRefreshPage = () => {
    window.location.reload();
  };

  if (isPublished) {
    return (
      <AdminRoute>
        <AdminLayout>
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
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
            </div>
          </div>
        </AdminLayout>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Добавить товар</h1>

            {/* Progress indicator during submission */}
            {(isSubmitting || totalProgress > 0) && (
              <div className="mb-6">
                <ProductCreationProgress
                  steps={progressSteps}
                  totalProgress={totalProgress}
                />
              </div>
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
            />
          </div>
        </div>
        <ProductPreviewDialog
          isOpen={isPreviewOpen}
          onClose={closePreview}
          onConfirm={handleConfirmPublish}
          productData={richPreviewData}
          isSubmitting={isSubmitting}
        />
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminAddProduct;
