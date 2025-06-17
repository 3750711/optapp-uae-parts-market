
import React, { useState } from "react";
import { OrderFormData, SellerProfile, ProfileShort, DeliveryMethod } from "./types";
import SellerProductsDialog from "./SellerProductsDialog";
import { toast } from "@/hooks/use-toast";
import { ProductInfoSection } from "./sections/ProductInfoSection";
import { CarBrandModelSection } from "./sections/CarBrandModelSection";
import { PricingSection } from "./sections/PricingSection";
import { SimpleParticipantsSection } from "./sections/SimpleParticipantsSection";
import { OrderDetailsSection } from "./sections/OrderDetailsSection";

interface SellerOrderFormFieldsProps {
  formData: OrderFormData;
  handleInputChange: (field: string, value: string) => void;
  buyerProfiles: ProfileShort[];
  sellerProfiles: SellerProfile[];
  selectedSeller: SellerProfile | null;
  // Car brand and model props
  brands: { id: string; name: string }[];
  brandModels: { id: string; name: string; brand_id: string }[];
  isLoadingCarData: boolean;
  searchBrandTerm: string;
  setSearchBrandTerm: (term: string) => void;
  searchModelTerm: string;
  setSearchModelTerm: (term: string) => void;
  filteredBrands: { id: string; name: string }[];
  filteredModels: { id: string; name: string; brand_id: string }[];
  // Enhanced handlers for brand/model selection
  handleBrandChange?: (brandId: string, brandName: string) => void;
  handleModelChange?: (modelId: string, modelName: string) => void;
  parseTitleForBrand: (title: string) => void;
  onImagesUpload?: (urls: string[]) => void;
  onVideosUpload?: (urls: string[]) => void;
  onDataFromProduct?: (data: any) => void;
  disabled?: boolean;
}

interface Product {
  id: string;
  title: string;
  price: number;
  brand?: string;
  model?: string;
  lot_number: number;
  delivery_price?: number;
  place_number?: number;
  product_images?: { url: string; is_primary?: boolean }[];
  product_videos?: { url: string }[];
}

export const SellerOrderFormFields: React.FC<SellerOrderFormFieldsProps> = ({
  formData,
  handleInputChange,
  buyerProfiles,
  sellerProfiles,
  selectedSeller,
  brands,
  brandModels,
  isLoadingCarData,
  searchBrandTerm,
  setSearchBrandTerm,
  searchModelTerm,
  setSearchModelTerm,
  filteredBrands,
  filteredModels,
  handleBrandChange,
  handleModelChange,
  parseTitleForBrand,
  onImagesUpload,
  onVideosUpload,
  onDataFromProduct,
  disabled = false,
}) => {
  const [showProductsDialog, setShowProductsDialog] = useState(false);

  console.log('🔧 SellerOrderFormFields render:', {
    brandId: formData.brandId,
    modelId: formData.modelId,
    brandsCount: brands.length,
    modelsCount: brandModels.length,
    hasHandlers: !!handleBrandChange && !!handleModelChange
  });

  const handleAddDataFromProduct = () => {
    if (!selectedSeller) {
      toast({
        title: "Внимание",
        description: "Товары будут загружены автоматически",
        variant: "default",
      });
      return;
    }
    setShowProductsDialog(true);
  };

  const handleProductSelect = (product: Product) => {
    console.log("Selected product:", product);

    // Update form fields with product data
    handleInputChange('title', product.title);
    handleInputChange('price', product.price.toString());
    
    if (product.brand && handleBrandChange) {
      const brandObj = brands.find(b => b.name.toLowerCase() === product.brand?.toLowerCase());
      if (brandObj) {
        handleBrandChange(brandObj.id, brandObj.name);
      }
    }
    
    if (product.model && handleModelChange) {
      const modelObj = brandModels.find(m => m.name.toLowerCase() === product.model?.toLowerCase());
      if (modelObj) {
        handleModelChange(modelObj.id, modelObj.name);
      }
    }

    if (product.delivery_price) {
      handleInputChange('delivery_price', product.delivery_price.toString());
    }

    if (product.place_number) {
      handleInputChange('place_number', product.place_number.toString());
    }

    // Copy product images
    if (product.product_images && product.product_images.length > 0 && onImagesUpload) {
      const imageUrls = product.product_images.map(img => img.url);
      onImagesUpload(imageUrls);
    }

    // Copy product videos
    if (product.product_videos && product.product_videos.length > 0 && onVideosUpload) {
      const videoUrls = product.product_videos.map(video => video.url);
      onVideosUpload(videoUrls);
    }

    parseTitleForBrand(product.title);

    if (onDataFromProduct) {
      onDataFromProduct(product);
    }

    const mediaCount = (product.product_images?.length || 0) + (product.product_videos?.length || 0);
    toast({
      title: "Данные скопированы",
      description: `Данные из товара "${product.title}" успешно добавлены в форму${mediaCount > 0 ? ` (медиафайлов: ${mediaCount})` : ''}`,
    });
  };

  // Use enhanced handlers if available, fallback to basic handleInputChange
  const onBrandChange = handleBrandChange || ((brandId: string, brandName: string) => {
    handleInputChange('brandId', brandId);
    handleInputChange('brand', brandName);
  });

  const onModelChange = handleModelChange || ((modelId: string, modelName: string) => {
    handleInputChange('modelId', modelId);
    handleInputChange('model', modelName);
  });

  return (
    <div className="space-y-6">
      <ProductInfoSection
        title={formData.title}
        onTitleChange={(value) => handleInputChange('title', value)}
        selectedSeller={selectedSeller}
        onAddDataFromProduct={handleAddDataFromProduct}
        onTitleBlur={parseTitleForBrand}
        disabled={disabled}
      />

      <CarBrandModelSection
        brandId={formData.brandId}
        modelId={formData.modelId}
        onBrandChange={onBrandChange}
        onModelChange={onModelChange}
        brands={brands}
        filteredModels={filteredModels}
        isLoadingCarData={isLoadingCarData}
        searchBrandTerm={searchBrandTerm}
        setSearchBrandTerm={setSearchBrandTerm}
        searchModelTerm={searchModelTerm}
        setSearchModelTerm={setSearchModelTerm}
        filteredBrands={filteredBrands}
        disabled={disabled}
      />

      <PricingSection
        price={formData.price}
        deliveryPrice={formData.delivery_price}
        onPriceChange={(value) => handleInputChange('price', value)}
        onDeliveryPriceChange={(value) => handleInputChange('delivery_price', value)}
        disabled={disabled}
      />

      <SimpleParticipantsSection
        buyerOptId={formData.buyerOptId}
        sellerId={formData.sellerId}
        onBuyerOptIdChange={(value) => handleInputChange("buyerOptId", value)}
        onSellerIdChange={(value) => handleInputChange("sellerId", value)}
        buyerProfiles={buyerProfiles}
        sellerProfiles={sellerProfiles}
        disabled={disabled}
        hideSeller={false}
      />

      <OrderDetailsSection
        deliveryMethod={formData.deliveryMethod}
        placeNumber={formData.place_number}
        textOrder={formData.text_order}
        onDeliveryMethodChange={(value) => handleInputChange('deliveryMethod', value)}
        onPlaceNumberChange={(value) => handleInputChange('place_number', value)}
        onTextOrderChange={(value) => handleInputChange('text_order', value)}
        disabled={disabled}
      />

      {/* Seller Products Dialog */}
      <SellerProductsDialog
        open={showProductsDialog}
        onOpenChange={setShowProductsDialog}
        sellerId={selectedSeller?.id || null}
        sellerName={selectedSeller?.full_name || ""}
        onProductSelect={handleProductSelect}
      />
    </div>
  );
};
