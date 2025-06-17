import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ParticipantsSection } from './sections/ParticipantsSection';
import { ProductInfoSection } from './sections/ProductInfoSection';
import { CarBrandModelSection } from './sections/CarBrandModelSection';
import { PricingSection } from './sections/PricingSection';
import { OrderDetailsSection } from './sections/OrderDetailsSection';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BuyerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

interface SellerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

interface CarBrand {
  id: string;
  name: string;
}

interface CarModel {
  id: string;
  name: string;
  brand_id: string;
}

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
  const [profilesStatus, setProfilesStatus] = useState<{
    buyersCount: number;
    sellersCount: number;
    isLoading: boolean;
  }>({ buyersCount: 0, sellersCount: 0, isLoading: true });

  // Проверяем статус профилей для отладки
  useEffect(() => {
    const checkProfilesStatus = async () => {
      try {
        const [buyersResult, sellersResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('id', { count: 'exact' })
            .eq('user_type', 'buyer'),
          supabase
            .from('profiles')
            .select('id', { count: 'exact' })
            .eq('user_type', 'seller')
        ]);

        console.log('📊 Profiles status check:', {
          buyers: buyersResult.count || 0,
          sellers: sellersResult.count || 0,
          buyerProfilesLength: buyerProfiles.length,
          sellerProfilesLength: sellerProfiles.length
        });

        setProfilesStatus({
          buyersCount: buyersResult.count || 0,
          sellersCount: sellersResult.count || 0,
          isLoading: false
        });
      } catch (error) {
        console.error('❌ Error checking profiles status:', error);
        setProfilesStatus(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkProfilesStatus();
  }, [buyerProfiles.length, sellerProfiles.length]);

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
      {/* Отладочная информация */}
      {!profilesStatus.isLoading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            База данных: Покупателей {profilesStatus.buyersCount}, Продавцов {profilesStatus.sellersCount} | 
            Загружено: Покупателей {buyerProfiles.length}, Продавцов {sellerProfiles.length}
          </AlertDescription>
        </Alert>
      )}

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
          <ParticipantsSection
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
            deliveryMethod={formData.deliveryMethod || 'self_pickup'}
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
