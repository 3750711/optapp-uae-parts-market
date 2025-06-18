
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePreloadedFormData } from '@/hooks/usePreloadedFormData';

interface OptimizedSellerOrderFormFieldsProps {
  formData: any;
  handleInputChange: (field: string, value: string) => void;
  disabled?: boolean;
}

const OptimizedSellerOrderFormFields: React.FC<OptimizedSellerOrderFormFieldsProps> = ({
  formData,
  handleInputChange,
  disabled = false
}) => {
  const {
    brands,
    buyerProfiles,
    sellerProfiles,
    isLoadingBrands,
    isLoadingBuyers,
    isLoadingSellers,
    getModelsByBrand,
    findBrandById,
    findModelById
  } = usePreloadedFormData();

  // Получаем модели для выбранного бренда
  const availableModels = formData.brandId ? getModelsByBrand(formData.brandId) : [];

  const handleBrandChange = (brandId: string) => {
    const brand = findBrandById(brandId);
    if (brand) {
      handleInputChange('brandId', brandId);
      handleInputChange('brand', brand.name);
      // Сбрасываем модель при смене бренда
      handleInputChange('modelId', '');
      handleInputChange('model', '');
    }
  };

  const handleModelChange = (modelId: string) => {
    const model = findModelById(modelId);
    if (model) {
      handleInputChange('modelId', modelId);
      handleInputChange('model', model.name);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Основная информация о заказе</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Название товара */}
          <div className="space-y-2">
            <Label htmlFor="title">Название товара *</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Введите название товара..."
              disabled={disabled}
              className="bg-white"
            />
          </div>

          {/* Бренд и модель */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brandId">Бренд</Label>
              {isLoadingBrands ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={formData.brandId || ''}
                  onValueChange={handleBrandChange}
                  disabled={disabled}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Выберите бренд..." />
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
              {!isLoadingBrands && brands.length === 0 && (
                <p className="text-sm text-gray-500">Бренды не загружены</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelId">Модель</Label>
              <Select
                value={formData.modelId || ''}
                onValueChange={handleModelChange}
                disabled={disabled || !formData.brandId}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={formData.brandId ? "Выберите модель..." : "Сначала выберите бренд"} />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                  {availableModels.length === 0 && formData.brandId && (
                    <div className="py-2 px-3 text-sm text-gray-500">
                      Модели не найдены для данного бренда
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Цена */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Цена товара *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price || ''}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="0"
                disabled={disabled}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_price">Стоимость доставки</Label>
              <Input
                id="delivery_price"
                type="number"
                value={formData.delivery_price || ''}
                onChange={(e) => handleInputChange('delivery_price', e.target.value)}
                placeholder="0"
                disabled={disabled}
                className="bg-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Участники сделки</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buyerOptId">OPT_ID покупателя *</Label>
              {isLoadingBuyers ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={formData.buyerOptId || ''}
                  onValueChange={(value) => handleInputChange('buyerOptId', value)}
                  disabled={disabled}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Выберите покупателя..." />
                  </SelectTrigger>
                  <SelectContent>
                    {buyerProfiles.map((buyer) => (
                      <SelectItem key={buyer.id} value={buyer.opt_id}>
                        {buyer.full_name || 'Без имени'} ({buyer.opt_id})
                      </SelectItem>
                    ))}
                    {buyerProfiles.length === 0 && (
                      <div className="py-2 px-3 text-sm text-gray-500">
                        Покупатели не найдены
                      </div>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellerId">Продавец *</Label>
              {isLoadingSellers ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={formData.sellerId || ''}
                  onValueChange={(value) => handleInputChange('sellerId', value)}
                  disabled={disabled}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Выберите продавца..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sellerProfiles.map((seller) => (
                      <SelectItem key={seller.id} value={seller.id}>
                        {seller.opt_id ? `${seller.full_name || 'Без имени'} (${seller.opt_id})` : (seller.full_name || 'Без имени')}
                      </SelectItem>
                    ))}
                    {sellerProfiles.length === 0 && (
                      <div className="py-2 px-3 text-sm text-gray-500">
                        Продавцы не найдены
                      </div>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Детали заказа</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryMethod">Способ доставки</Label>
                <Select
                  value={formData.deliveryMethod || 'cargo_rf'}
                  onValueChange={(value) => handleInputChange('deliveryMethod', value)}
                  disabled={disabled}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self_pickup">Самовывоз</SelectItem>
                    <SelectItem value="cargo_rf">Карго РФ</SelectItem>
                    <SelectItem value="cargo_kz">Карго КЗ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="place_number">Количество мест</Label>
                <Input
                  id="place_number"
                  type="number"
                  value={formData.place_number || '1'}
                  onChange={(e) => handleInputChange('place_number', e.target.value)}
                  min="1"
                  disabled={disabled}
                  className="bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text_order">Дополнительная информация</Label>
              <Textarea
                id="text_order"
                value={formData.text_order || ''}
                onChange={(e) => handleInputChange('text_order', e.target.value)}
                placeholder="Введите дополнительную информацию о заказе..."
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

export default OptimizedSellerOrderFormFields;
