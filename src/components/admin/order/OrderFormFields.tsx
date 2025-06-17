
import React, { useState } from "react";
import { OrderFormData, SellerProfile, BuyerProfile, DeliveryMethod } from "@/types/order";
import SellerProductsDialog from "./SellerProductsDialog";
import { toast } from "@/hooks/use-toast";
import { ProductInfoSection } from "./sections/ProductInfoSection";
import { CarBrandModelSection } from "./sections/CarBrandModelSection";
import { PricingSection } from "./sections/PricingSection";
import { SimpleParticipantsSection } from "./sections/SimpleParticipantsSection";
import { SellerInfoSection } from "./sections/SellerInfoSection";
import { OrderDetailsSection } from "./sections/OrderDetailsSection";

interface OrderFormFieldsProps {
  formData: OrderFormData;
  handleInputChange: (field: string, value: string) => void;
  buyerProfiles: BuyerProfile[];
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
  // Add disabled prop
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
  disabled = false,
}) => {
  return (
    <div className="space-y-6">
      <ProductInfoSection
        title={formData.title}
        onTitleChange={(value) => handleInputChange('title', value)}
        onTitleBlur={parseTitleForBrand}
        disabled={disabled}
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
      />

      <SellerInfoSection selectedSeller={selectedSeller} />

      <OrderDetailsSection
        deliveryMethod={formData.deliveryMethod}
        placeNumber={formData.place_number}
        textOrder={formData.text_order}
        onDeliveryMethodChange={(value) => handleInputChange('deliveryMethod', value)}
        onPlaceNumberChange={(value) => handleInputChange('place_number', value)}
        onTextOrderChange={(value) => handleInputChange('text_order', value)}
        disabled={disabled}
      />
    </div>
  );
};
