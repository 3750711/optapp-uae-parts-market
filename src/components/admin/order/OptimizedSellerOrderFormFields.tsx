
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { CarBrand, CarModel } from '@/hooks/useLazyCarData';
import type { BuyerProfile, SellerProfile, OrderStatus } from '@/types/order';

interface OptimizedSellerOrderFormFieldsProps {
  formData: any;
  handleInputChange: (field: string, value: string) => void;
  disabled?: boolean;
  // Car data (from parent)
  brands: CarBrand[];
  models: CarModel[];
  isLoadingBrands: boolean;
  isLoadingModels: boolean;
  enableBrandsLoading: () => void;
  selectBrand: (brandId: string) => void;
  findBrandNameById: (brandId: string | null) => string | null;
  findModelNameById: (modelId: string | null) => string | null;
  // Profiles (from parent)
  buyerProfiles: BuyerProfile[];
  sellerProfiles: SellerProfile[];
  isLoadingBuyers: boolean;
  isLoadingSellers: boolean;
  enableBuyersLoading: () => void;
  enableSellersLoading: () => void;
}

const OptimizedSellerOrderFormFields: React.FC<OptimizedSellerOrderFormFieldsProps> = ({
  formData,
  handleInputChange,
  disabled = false,
  // car data
  brands,
  models,
  isLoadingBrands,
  isLoadingModels,
  enableBrandsLoading,
  selectBrand,
  findBrandNameById,
  findModelNameById,
  // profiles
  buyerProfiles,
  sellerProfiles,
  isLoadingBuyers,
  isLoadingSellers,
  enableBuyersLoading,
  enableSellersLoading,
}) => {

  const handleBrandFocus = () => {
    enableBrandsLoading();
  };

  const handleBrandChange = (brandId: string) => {
    const brandName = findBrandNameById(brandId);
    if (brandName) {
      handleInputChange('brandId', brandId);
      handleInputChange('brand', brandName);
      // Подгружаем модели для выбранного бренда (сброс модели выполняется централизованно при фактической смене бренда)
      selectBrand(brandId);
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

  const handleSellerFocus = () => {
    enableSellersLoading();
  };
  useEffect(() => {
    if (formData?.brandId) {
      selectBrand(formData.brandId);
    }
  }, [formData?.brandId, selectBrand]);

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
              <Label htmlFor="brandId">Бренд *</Label>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelId">Модель</Label>
              <Select
                value={formData.modelId || ''}
                onValueChange={handleModelChange}
                disabled={disabled || !formData.brandId}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={
                    formData.brandId
                      ? (formData.model || (isLoadingModels ? 'Загрузка моделей...' : 'Выберите модель...'))
                      : 'Сначала выберите бренд'
                  } />
                </SelectTrigger>
                  <SelectContent>
                    {isLoadingModels ? (
                      <SelectItem disabled value="loading">Загрузка моделей...</SelectItem>
                    ) : models.length === 0 ? (
                      <SelectItem disabled value="empty">Модели не найдены</SelectItem>
                    ) : (
                      models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))
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
                step="0.01"
                min="0"
                inputMode="decimal"
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
          <CardTitle>Участники сделки</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sellerId">Продавец *</Label>
              {isLoadingSellers ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={formData.sellerId || ''}
                  onValueChange={(value) => handleInputChange('sellerId', value)}
                  onOpenChange={(open) => open && handleSellerFocus()}
                  disabled={disabled}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Выберите продавца..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sellerProfiles
                      .sort((a, b) => (a.opt_id || '').localeCompare(b.opt_id || ''))
                      .map((seller) => (
                        <SelectItem key={seller.id} value={seller.id}>
                          {seller.opt_id ? `${seller.opt_id} - ${seller.full_name || 'Без имени'}` : (seller.full_name || 'Без имени')}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyerOptId">OPT_ID покупателя *</Label>
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
                    <SelectValue placeholder="Выберите покупателя..." />
                  </SelectTrigger>
                  <SelectContent>
                    {buyerProfiles
                      .sort((a, b) => (a.opt_id || '').localeCompare(b.opt_id || ''))
                      .map((buyer) => (
                        <SelectItem key={buyer.id} value={buyer.opt_id}>
                          {buyer.opt_id} - {buyer.full_name || 'Без имени'}
                        </SelectItem>
                      ))}
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
                <Label htmlFor="place_number">Количество мест *</Label>
                <Input
                  id="place_number"
                  type="number"
                  value={formData.place_number || ''}
                  onChange={(e) => handleInputChange('place_number', e.target.value)}
                  min="1"
                  placeholder="Введите количество мест"
                  disabled={disabled}
                  className="bg-white"
                  required
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

            {/* Статус заказа */}
            <div className="space-y-2">
              <Label htmlFor="status">Статус заказа *</Label>
              <Select
                value={formData.status || 'created'}
                onValueChange={(value) => handleInputChange('status', value as OrderStatus)}
                disabled={disabled}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Создан</SelectItem>
                  <SelectItem value="seller_confirmed">Подтвержден продавцом</SelectItem>
                  <SelectItem value="admin_confirmed">Подтвержден администратором</SelectItem>
                  <SelectItem value="processed">В обработке</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizedSellerOrderFormFields;
