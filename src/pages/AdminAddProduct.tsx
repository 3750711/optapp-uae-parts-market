
import React from "react";
import { AdminRoute } from "@/components/auth/AdminRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import AddProductForm from "@/components/product/AddProductForm";
import { useOptimizedAdminAddProduct } from "@/hooks/useOptimizedAdminAddProduct";
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
    isPreviewOpen,
    closePreview,
    richPreviewData,
    handleConfirmPublish,
  } = useOptimizedAdminAddProduct();

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Добавить товар</h1>

            
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
