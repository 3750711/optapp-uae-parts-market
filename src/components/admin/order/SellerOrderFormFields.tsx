import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLazyCarData } from '@/hooks/useLazyCarData';
import { useLazyProfiles } from '@/hooks/useLazyProfiles';

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
          <CardTitle>Main Order Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Название товара */}
          <div className="space-y-2">
            <Label htmlFor="title">Product Title *</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter product title..."
              disabled={disabled}
              className="bg-white"
            />
          </div>

          {/* Бренд и модель */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brandId">Brand</Label>
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
                    <SelectValue placeholder="Select brand..." />
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
              <Label htmlFor="modelId">Model</Label>
              {isLoadingModels ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={formData.modelId || ''}
                  onValueChange={handleModelChange}
                  disabled={disabled || !formData.brandId}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder={formData.brandId ? "Select model..." : "Select brand first"} />
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
              <Label htmlFor="price">Product Price *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price || ''}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="0"
                step="0.01"
                min="0"
                inputMode="decimal"
                disabled={disabled}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_price">Delivery Cost</Label>
              <Input
                id="delivery_price"
                type="number"
                value={formData.delivery_price || ''}
                onChange={(e) => handleInputChange('delivery_price', e.target.value)}
                placeholder="0"
                step="0.01"
                min="0"
                inputMode="decimal"
                disabled={disabled}
                className="bg-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Buyer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="buyerOptId">Buyer's OPT_ID *</Label>
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
                  <SelectValue placeholder="Select buyer..." />
                </SelectTrigger>
                <SelectContent>
                  {buyerProfiles.map((buyer) => (
                    <SelectItem key={buyer.id} value={buyer.opt_id}>
                      {buyer.full_name || 'No name'} ({buyer.opt_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {buyerProfiles.length === 0 && !isLoadingBuyers && (
              <p className="text-sm text-gray-500 mt-1">
                No buyer profiles available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryMethod">Delivery Method</Label>
                <Select
                  value={formData.deliveryMethod || 'cargo_rf'}
                  onValueChange={(value) => handleInputChange('deliveryMethod', value)}
                  disabled={disabled}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self_pickup">Self Pickup</SelectItem>
                    <SelectItem value="cargo_rf">Cargo RF</SelectItem>
                    <SelectItem value="cargo_kz">Cargo KZ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="place_number">Number of Places *</Label>
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
              <Label htmlFor="text_order">Additional Information</Label>
              <Textarea
                id="text_order"
                value={formData.text_order || ''}
                onChange={(e) => handleInputChange('text_order', e.target.value)}
                placeholder="Enter additional order information..."
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