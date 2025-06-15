
import React from "react";
import { AdminRoute } from "@/components/auth/AdminRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import AddProductForm from "@/components/product/AddProductForm";
import { useAdminAddProduct } from "@/hooks/useAdminAddProduct";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ProductPreviewDialog from "@/components/admin/ProductPreviewDialog";

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
    showDraftSaved,
    // New props for preview
    isPreviewOpen,
    closePreview,
    richPreviewData,
    handleConfirmPublish,
  } = useAdminAddProduct();

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Добавить товар</h1>

            {showDraftSaved && (
              <Alert className="mb-6 bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-700" />
                <AlertDescription className="text-blue-700">
                  Загружен сохраненный черновик. Вы можете продолжить заполнение.
                </AlertDescription>
              </Alert>
            )}
            
            <AddProductForm
              form={form}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              imageUrls={imageUrls}
              videoUrls={videoUrls}
              brands={brands}
              brandModels={brandModels}
              isLoadingCarData={isLoadingCarData}
              watchBrandId={form.watch("brandId")}
              handleMobileOptimizedImageUpload={handleMobileOptimizedImageUpload}
              setVideoUrls={setVideoUrls}
              primaryImage={primaryImage}
              setPrimaryImage={setPrimaryImage}
              sellers={sellers}
              showSellerSelection={true}
              onImageDelete={handleImageDelete}
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
