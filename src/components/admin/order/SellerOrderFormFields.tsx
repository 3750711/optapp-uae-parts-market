import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleParticipantsSection } from './sections/SimpleParticipantsSection';
import { ProductInfoSection } from './sections/ProductInfoSection';
import { CarBrandModelSection } from './sections/CarBrandModelSection';
import { PricingSection } from './sections/PricingSection';
import { OrderDetailsSection } from './sections/OrderDetailsSection';
import { BuyerProfile, SellerProfile, CarBrand, CarModel } from '@/types/order';

interface SellerOrderFormFieldsProps {
  formData: any;
  handleInputChange: (field: string, value: string) => void;
  buyerProfiles: BuyerProfile[];
  sellerProfiles: SellerProfile[];
  selectedSeller: SellerProfile | null;
  brands: CarBrand[];
  brandModels: CarModel[];
  isLoadingCarData: boolean;
  searchBrandTerm: string;
  setSearchBrandTerm: (term: string) => void;
  searchModelTerm: string;
  setSearchModelTerm: (term: string) => void;
  filteredBrands: CarBrand[];
  filteredModels: CarModel[];
  handleBrandChange?: (brandId: string, brandName: string) => void;
  handleModelChange?: (modelId: string, modelName: string) => void;
  parseTitleForBrand: (title: string) => { brand: string; model: string };
  onImagesUpload: (urls: string[]) => void;
  onDataFromProduct: (data: any) => void;
  disabled?: boolean;
}

const SellerOrderFormFields: React.FC<SellerOrderFormFieldsProps> = ({
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
  onDataFromProduct,
  disabled = false
}) => {
  const handleTitleBlur = (title: string) => {
    if (title && parseTitleForBrand) {
      parseTitleForBrand(title);
    }
  };

  const handleAddDataFromProduct = () => {
    if (onDataFromProduct) {
      onDataFromProduct({});
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Основная информация о заказе</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProductInfoSection
            title={formData.title || ''}
            onTitleChange={(value) => handleInputChange('title', value)}
            selectedSeller={selectedSeller}
            onAddDataFromProduct={handleAddDataFromProduct}
            onTitleBlur={handleTitleBlur}
            disabled={disabled}
          />
          
          <CarBrandModelSection
            brandId={formData.brandId || ''}
            modelId={formData.modelId || ''}
            onBrandChange={handleBrandChange || (() => {})}
            onModelChange={handleModelChange || (() => {})}
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
            price={formData.price || ''}
            deliveryPrice={formData.delivery_price || ''}
            onPriceChange={(value) => handleInputChange('price', value)}
            onDeliveryPriceChange={(value) => handleInputChange('delivery_price', value)}
            disabled={disabled}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Участники сделки</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleParticipantsSection
            buyerOptId={formData.buyerOptId || ''}
            sellerId={formData.sellerId || ''}
            onBuyerOptIdChange={(value) => handleInputChange('buyerOptId', value)}
            onSellerIdChange={(value) => handleInputChange('sellerId', value)}
            buyerProfiles={buyerProfiles}
            sellerProfiles={sellerProfiles}
            disabled={disabled}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Детали заказа</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderDetailsSection
            deliveryMethod={formData.deliveryMethod || 'cargo_rf'}
            placeNumber={formData.place_number || '1'}
            textOrder={formData.text_order || ''}
            onDeliveryMethodChange={(value) => handleInputChange('deliveryMethod', value)}
            onPlaceNumberChange={(value) => handleInputChange('place_number', value)}
            onTextOrderChange={(value) => handleInputChange('text_order', value)}
            disabled={disabled}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerOrderFormFields;
