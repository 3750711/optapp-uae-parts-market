import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLazyCarData } from '@/hooks/useLazyCarData';
import { useLazyProfiles } from '@/hooks/useLazyProfiles';
import { useLanguage } from '@/hooks/useLanguage';
import { getSellerPagesTranslations } from '@/utils/translations/sellerPages';

interface SellerOrderFormFieldsProps {
  formData: any;
  handleInputChange: (field: string, value: string) => void;
  disabled?: boolean;
}

const SellerOrderFormFields: React.FC<SellerOrderFormFieldsProps> = ({
  formData,
  handleInputChange,
  disabled = false
}) => {
  const { language } = useLanguage();
  const t = getSellerPagesTranslations(language);
  
  const {
    brands,
    models,
    isLoadingBrands,
    isLoadingModels,
    enableBrandsLoading,
    selectBrand,
    findBrandNameById,
    findModelNameById
  } = useLazyCarData();

  const {
    buyerProfiles,
    isLoadingBuyers,
    enableBuyersLoading
  } = useLazyProfiles();

  const handleBrandFocus = () => {
    enableBrandsLoading();
  };

  const handleBrandChange = (brandId: string) => {
    const brandName = findBrandNameById(brandId);
    if (brandName) {
      handleInputChange('brandId', brandId);
      handleInputChange('brand', brandName);
      selectBrand(brandId);
      // Reset model when brand changes
      handleInputChange('modelId', '');
      handleInputChange('model', '');
    }
  };

  const handleModelChange = (modelId: string) => {
    const modelName = findModelNameById(modelId);
    if (modelName) {
      handleInputChange('modelId', modelId);
      handleInputChange('model', modelName);
    }
  };

  const handleBuyerFocus = () => {
    enableBuyersLoading();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.createOrderForm.mainOrderInformation}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Название товара */}
          <div className="space-y-2">
            <Label htmlFor="title">{t.createOrderForm.productTitle}</Label>
            <Textarea
              id="title"
              value={formData.title || ''}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder={t.createOrderForm.productTitlePlaceholder}
              rows={3}
              disabled={disabled}
              className="bg-white"
            />
          </div>

          {/* Бренд и модель */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brandId">{t.createOrderForm.brand}</Label>
              {isLoadingBrands ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={formData.brandId || ''}
                  onValueChange={handleBrandChange}
                  onOpenChange={(open) => open && handleBrandFocus()}
                  disabled={disabled}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder={t.createOrderForm.brandPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelId">{t.createOrderForm.model}</Label>
              {isLoadingModels ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={formData.modelId || ''}
                  onValueChange={handleModelChange}
                  disabled={disabled || !formData.brandId}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder={formData.brandId ? t.createOrderForm.modelPlaceholder : t.createOrderForm.modelPlaceholderFirst} />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Цена */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">{t.createOrderForm.productPrice}</Label>
              <Input
                id="price"
                type="number"
                value={formData.price || ''}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="0"
                step="1"
                min="0"
                inputMode="numeric"
                disabled={disabled}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_price">{t.createOrderForm.deliveryCost}</Label>
              <Input
                id="delivery_price"
                type="number"
                value={formData.delivery_price || ''}
                onChange={(e) => handleInputChange('delivery_price', e.target.value)}
                placeholder="0"
                step="1"
                min="0"
                inputMode="numeric"
                disabled={disabled}
                className="bg-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.createOrderForm.buyer}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="buyerOptId">{t.createOrderForm.buyerOptId}</Label>
            {isLoadingBuyers ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={formData.buyerOptId || ''}
                onValueChange={(value) => handleInputChange('buyerOptId', value)}
                onOpenChange={(open) => open && handleBuyerFocus()}
                disabled={disabled}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={t.createOrderForm.buyerPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {buyerProfiles
                    .sort((a, b) => (a.opt_id || '').localeCompare(b.opt_id || ''))
                    .map((buyer) => (
                      <SelectItem key={buyer.id} value={buyer.opt_id}>
                        {buyer.opt_id} - {buyer.full_name || t.createOrderForm.noName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
            {buyerProfiles.length === 0 && !isLoadingBuyers && (
              <p className="text-sm text-gray-500 mt-1">
                {t.createOrderForm.noBuyerProfiles}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.createOrderForm.orderDetails}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryMethod">{t.createOrderForm.deliveryMethod}</Label>
                <Select
                  value={formData.deliveryMethod || 'cargo_rf'}
                  onValueChange={(value) => handleInputChange('deliveryMethod', value)}
                  disabled={disabled}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self_pickup">{t.deliveryMethods.selfPickup}</SelectItem>
                    <SelectItem value="cargo_rf">{t.deliveryMethods.cargoRf}</SelectItem>
                    <SelectItem value="cargo_kz">{t.deliveryMethods.cargoKz}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="place_number">{t.createOrderForm.numberOfPlaces}</Label>
                <Input
                  id="place_number"
                  type="number"
                  value={formData.place_number || '1'}
                  onChange={(e) => handleInputChange('place_number', e.target.value)}
                  min="1"
                  placeholder="1"
                  disabled={disabled}
                  className="bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text_order">{t.createOrderForm.additionalInfo}</Label>
              <Textarea
                id="text_order"
                value={formData.text_order || ''}
                onChange={(e) => handleInputChange('text_order', e.target.value)}
                placeholder={t.createOrderForm.additionalInfoPlaceholder}
                rows={3}
                disabled={disabled}
                className="bg-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerOrderFormFields;