import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Package, DollarSign, Truck } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileFormSection } from './MobileFormSection';
import { FormValidationState } from './types';
import { useLazyProfiles } from '@/hooks/useLazyProfiles';

interface OptimizedSellerOrderFormFieldsProps {
  formData: any;
  handleInputChange: (field: string, value: string) => void;
  disabled?: boolean;
  validation?: FormValidationState;
  onFieldTouch?: (field: string) => void;
}

const OptimizedSellerOrderFormFields: React.FC<OptimizedSellerOrderFormFieldsProps> = ({
  formData,
  handleInputChange,
  disabled = false,
  validation,
  onFieldTouch
}) => {
  const isMobile = useIsMobile();
  const {
    sellerProfiles,
    isLoadingSellers,
    enableSellersLoading
  } = useLazyProfiles();

  React.useEffect(() => {
    enableSellersLoading();
  }, [enableSellersLoading]);

  const handleFieldChange = (field: string, value: string) => {
    handleInputChange(field, value);
    onFieldTouch?.(field);
  };

  const getFieldError = (field: string) => {
    return validation?.errors[field];
  };

  const isFieldTouched = (field: string) => {
    return validation?.touchedFields.has(field);
  };

  return (
    <div className="space-y-6">
      {/* Seller Selection */}
      <MobileFormSection 
        title="Выбор продавца" 
        icon={<User className="h-5 w-5" />}
        defaultOpen={true}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="sellerId" className="text-sm font-medium">
              Продавец *
            </Label>
            <Select 
              value={formData.sellerId || ''} 
              onValueChange={(value) => handleFieldChange('sellerId', value)}
              disabled={disabled || isLoadingSellers}
            >
              <SelectTrigger className={`mt-1 ${getFieldError('sellerId') ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Выберите продавца" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {isLoadingSellers ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Загрузка...
                  </div>
                ) : sellerProfiles.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Продавцы не найдены
                  </div>
                ) : (
                  sellerProfiles.map((seller) => (
                    <SelectItem key={seller.id} value={seller.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{seller.full_name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {seller.opt_id}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {getFieldError('sellerId') && (
              <p className="text-red-500 text-xs mt-1">{getFieldError('sellerId')}</p>
            )}
          </div>
        </div>
      </MobileFormSection>

      {/* Product Information */}
      <MobileFormSection 
        title="Информация о товаре" 
        icon={<Package className="h-5 w-5" />}
        defaultOpen={true}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-sm font-medium">
              Название товара *
            </Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              onBlur={() => onFieldTouch?.('title')}
              placeholder="Введите название товара"
              disabled={disabled}
              className={`mt-1 ${getFieldError('title') ? 'border-red-500' : ''}`}
            />
            {getFieldError('title') && (
              <p className="text-red-500 text-xs mt-1">{getFieldError('title')}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand" className="text-sm font-medium">Бренд</Label>
              <Input
                id="brand"
                value={formData.brand || ''}
                onChange={(e) => handleFieldChange('brand', e.target.value)}
                placeholder="Бренд товара"
                disabled={disabled}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="model" className="text-sm font-medium">Модель</Label>
              <Input
                id="model"
                value={formData.model || ''}
                onChange={(e) => handleFieldChange('model', e.target.value)}
                placeholder="Модель товара"
                disabled={disabled}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="text_order" className="text-sm font-medium">
              Дополнительная информация
            </Label>
            <Textarea
              id="text_order"
              value={formData.text_order || ''}
              onChange={(e) => handleFieldChange('text_order', e.target.value)}
              placeholder="Дополнительная информация о товаре (опционально)"
              disabled={disabled}
              className="mt-1 min-h-[80px]"
              rows={3}
            />
          </div>
        </div>
      </MobileFormSection>

      {/* Financial Information */}
      <MobileFormSection 
        title="Финансовая информация" 
        icon={<DollarSign className="h-5 w-5" />}
        defaultOpen={true}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="price" className="text-sm font-medium">
              Цена товара ($) *
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price || ''}
              onChange={(e) => handleFieldChange('price', e.target.value)}
              onBlur={() => onFieldTouch?.('price')}
              placeholder="0.00"
              disabled={disabled}
              className={`mt-1 ${getFieldError('price') ? 'border-red-500' : ''}`}
            />
            {getFieldError('price') && (
              <p className="text-red-500 text-xs mt-1">{getFieldError('price')}</p>
            )}
          </div>

          <div>
            <Label htmlFor="delivery_price" className="text-sm font-medium">
              Стоимость доставки ($)
            </Label>
            <Input
              id="delivery_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.delivery_price || ''}
              onChange={(e) => handleFieldChange('delivery_price', e.target.value)}
              placeholder="0.00"
              disabled={disabled}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="buyerOptId" className="text-sm font-medium">
              OPT ID покупателя *
            </Label>
            <Input
              id="buyerOptId"
              value={formData.buyerOptId || ''}
              onChange={(e) => handleFieldChange('buyerOptId', e.target.value.toUpperCase())}
              onBlur={() => onFieldTouch?.('buyerOptId')}
              placeholder="Введите OPT ID покупателя"
              disabled={disabled}
              className={`mt-1 ${getFieldError('buyerOptId') ? 'border-red-500' : ''}`}
            />
            {getFieldError('buyerOptId') && (
              <p className="text-red-500 text-xs mt-1">{getFieldError('buyerOptId')}</p>
            )}
          </div>
        </div>
      </MobileFormSection>

      {/* Delivery Information */}
      <MobileFormSection 
        title="Информация о доставке" 
        icon={<Truck className="h-5 w-5" />}
        defaultOpen={true}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="deliveryMethod" className="text-sm font-medium">
              Способ доставки
            </Label>
            <Select 
              value={formData.deliveryMethod || 'cargo_rf'} 
              onValueChange={(value) => handleFieldChange('deliveryMethod', value)}
              disabled={disabled}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Выберите способ доставки" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="cargo_rf">🚛 Cargo РФ</SelectItem>
                <SelectItem value="cargo_kz">🚚 Cargo КЗ</SelectItem>
                <SelectItem value="self_pickup">📦 Самовывоз</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="place_number" className="text-sm font-medium">
              Количество мест
            </Label>
            <Input
              id="place_number"
              type="number"
              min="1"
              value={formData.place_number || '1'}
              onChange={(e) => handleFieldChange('place_number', e.target.value)}
              placeholder="1"
              disabled={disabled}
              className="mt-1"
            />
          </div>
        </div>
      </MobileFormSection>
    </div>
  );
};

export default OptimizedSellerOrderFormFields;
