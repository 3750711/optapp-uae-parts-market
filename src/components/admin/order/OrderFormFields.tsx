

import React, { useState } from "react";
import { OrderFormData, SellerProfile, ProfileShort, DeliveryMethod } from "./types";
import SellerProductsDialog from "./SellerProductsDialog";
import { toast } from "@/hooks/use-toast";
import { ProductInfoSection } from "./sections/ProductInfoSection";
import { CarBrandModelSection } from "./sections/CarBrandModelSection";
import { PricingSection } from "./sections/PricingSection";
import { ParticipantsSection } from "./sections/ParticipantsSection";
import { SellerInfoSection } from "./sections/SellerInfoSection";
import { OrderDetailsSection } from "./sections/OrderDetailsSection";

interface OrderFormFieldsProps {
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
  // Add new prop for title parsing
  parseTitleForBrand: (title: string) => void;
  // Add new props for handling images and data from product
  onImagesUpload?: (urls: string[]) => void;
  onVideosUpload?: (urls: string[]) => void;
  onDataFromProduct?: (data: any) => void;
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

export const OrderFormFields: React.FC<OrderFormFieldsProps> = ({
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
  parseTitleForBrand,
  onImagesUpload,
  onVideosUpload,
  onDataFromProduct,
}) => {
  const [showProductsDialog, setShowProductsDialog] = useState(false);

  const handleAddDataFromProduct = () => {
    if (!selectedSeller) {
      toast({
        title: "Внимание",
        description: "Сначала выберите продавца",
        variant: "destructive",
      });
      return;
    }
    setShowProductsDialog(true);
  };

  const handleProductSelect = (product: Product) => {
    console.log("Selected product:", product);

    // Обновляем поля формы данными из товара
    handleInputChange('title', product.title);
    handleInputChange('price', product.price.toString());
    
    if (product.brand) {
      // Найти ID бренда по имени
      const brandObj = brands.find(b => b.name.toLowerCase() === product.brand?.toLowerCase());
      if (brandObj) {
        handleInputChange('brandId', brandObj.id);
      }
    }
    
    if (product.model) {
      // Найти ID модели по имени
      const modelObj = brandModels.find(m => m.name.toLowerCase() === product.model?.toLowerCase());
      if (modelObj) {
        handleInputChange('modelId', modelObj.id);
      }
    }

    if (product.delivery_price) {
      handleInputChange('delivery_price', product.delivery_price.toString());
    }

    if (product.place_number) {
      handleInputChange('place_number', product.place_number.toString());
    }

    // Копируем изображения товара
    if (product.product_images && product.product_images.length > 0 && onImagesUpload) {
      const imageUrls = product.product_images.map(img => img.url);
      onImagesUpload(imageUrls);
    }

    // Копируем видео товара
    if (product.product_videos && product.product_videos.length > 0 && onVideosUpload) {
      const videoUrls = product.product_videos.map(video => video.url);
      onVideosUpload(videoUrls);
    }

    // Вызываем парсинг названия для автозаполнения бренда/модели
    parseTitleForBrand(product.title);

    // Передаем данные в родительский компонент, если нужно
    if (onDataFromProduct) {
      onDataFromProduct(product);
    }

    const mediaCount = (product.product_images?.length || 0) + (product.product_videos?.length || 0);
    toast({
      title: "Данные скопированы",
      description: `Данные из товара "${product.title}" успешно добавлены в форму${mediaCount > 0 ? ` (медиафайлов: ${mediaCount})` : ''}`,
    });
  };

  return (
    <div className="space-y-6">
      <ProductInfoSection
        title={formData.title}
        onTitleChange={(value) => handleInputChange('title', value)}
        selectedSeller={selectedSeller}
        onAddDataFromProduct={handleAddDataFromProduct}
        onTitleBlur={parseTitleForBrand}
      />

      <CarBrandModelSection
        brandId={formData.brandId}
        modelId={formData.modelId}
        onBrandChange={(value) => handleInputChange('brandId', value)}
        onModelChange={(value) => handleInputChange('modelId', value)}
        brands={brands}
        filteredModels={filteredModels}
        isLoadingCarData={isLoadingCarData}
        searchBrandTerm={searchBrandTerm}
        setSearchBrandTerm={setSearchBrandTerm}
        searchModelTerm={searchModelTerm}
        setSearchModelTerm={setSearchModelTerm}
        filteredBrands={filteredBrands}
      />

      <PricingSection
        price={formData.price}
        deliveryPrice={formData.delivery_price}
        onPriceChange={(value) => handleInputChange('price', value)}
        onDeliveryPriceChange={(value) => handleInputChange('delivery_price', value)}
      />

      <ParticipantsSection
        buyerOptId={formData.buyerOptId}
        sellerId={formData.sellerId}
        onBuyerOptIdChange={(value) => handleInputChange("buyerOptId", value)}
        onSellerIdChange={(value) => handleInputChange("sellerId", value)}
        buyerProfiles={buyerProfiles}
        sellerProfiles={sellerProfiles}
      />

      <SellerInfoSection selectedSeller={selectedSeller} />

      <OrderDetailsSection
        deliveryMethod={formData.deliveryMethod}
        placeNumber={formData.place_number}
        textOrder={formData.text_order}
        onDeliveryMethodChange={(value) => handleInputChange('deliveryMethod', value)}
        onPlaceNumberChange={(value) => handleInputChange('place_number', value)}
        onTextOrderChange={(value) => handleInputChange('text_order', value)}
      />

      {/* Диалог выбора товаров продавца */}
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

