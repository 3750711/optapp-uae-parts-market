
import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AddProductForm from "@/components/product/AddProductForm";
import { useAdminAddProduct } from "@/hooks/useAdminAddProduct";

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
    searchBrandTerm,
    setSearchBrandTerm,
    searchModelTerm,
    setSearchModelTerm,
    filteredBrands,
    filteredModels,
    handleMobileOptimizedImageUpload,
  } = useAdminAddProduct();

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Добавить товар</h1>
          
          <AddProductForm
            form={form as any}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            imageUrls={imageUrls}
            videoUrls={videoUrls}
            brands={brands}
            brandModels={brandModels}
            isLoadingCarData={isLoadingCarData}
            watchBrandId={form.watch("brandId")}
            searchBrandTerm={searchBrandTerm}
            setSearchBrandTerm={setSearchBrandTerm}
            searchModelTerm={searchModelTerm}
            setSearchModelTerm={setSearchModelTerm}
            filteredBrands={filteredBrands}
            filteredModels={filteredModels}
            handleMobileOptimizedImageUpload={handleMobileOptimizedImageUpload}
            setVideoUrls={setVideoUrls}
            primaryImage={primaryImage}
            setPrimaryImage={setPrimaryImage}
            sellers={sellers}
            showSellerSelection={true}
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAddProduct;
