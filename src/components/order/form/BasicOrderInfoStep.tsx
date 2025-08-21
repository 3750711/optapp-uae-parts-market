
import React from 'react';
import { Label } from '@/components/ui/label';
import TouchOptimizedInput from '@/components/ui/TouchOptimizedInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SimpleCarSelector from '@/components/ui/SimpleCarSelector';
import { OrderFormData } from '@/hooks/useOrderForm';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BasicOrderInfoStepProps {
  formData: OrderFormData;
  touchedFields: Set<string>;
  onInputChange: (field: string, value: string) => void;
  isFieldValid: (field: string) => boolean;
  getFieldError: (field: string) => string | null;
  isMobile: boolean;
}

const BasicOrderInfoStep: React.FC<BasicOrderInfoStepProps> = ({
  formData,
  touchedFields,
  onInputChange,
  isFieldValid,
  getFieldError,
  isMobile
}) => {
  // Загружаем покупателей
  const { data: buyers = [], isLoading: isBuyersLoading } = useQuery({
    queryKey: ['buyers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'buyer')
        .order('full_name');

      if (error) {
        console.error('Error fetching buyers:', error);
        throw error;
      }
      return data || [];
    }
  });

  const handleBrandChange = (brandId: string, brandName: string) => {
    onInputChange('brandId', brandId);
    onInputChange('brand', brandName);
    // Сбрасываем модель при смене бренда
    onInputChange('modelId', '');
    onInputChange('model', '');
  };

  const handleModelChange = (modelId: string, modelName: string) => {
    onInputChange('modelId', modelId);
    onInputChange('model', modelName);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Основная информация</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Наименование */}
        <div className="space-y-2">
          <Label htmlFor="title" className={isMobile ? "text-base font-medium" : ""}>
            Наименование *
          </Label>
          <TouchOptimizedInput 
            id="title"
            value={formData.title}
            onChange={(e) => onInputChange('title', e.target.value)}
            placeholder="Введите наименование товара"
            touched={touchedFields.has('title')}
            error={getFieldError('title')}
            success={touchedFields.has('title') && isFieldValid('title')}
          />
        </div>

        {/* Цена */}
        <div className="space-y-2">
          <Label htmlFor="price" className={isMobile ? "text-base font-medium" : ""}>
            Цена ($) *
          </Label>
          <TouchOptimizedInput 
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) => onInputChange('price', e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
            touched={touchedFields.has('price')}
            error={getFieldError('price')}
            success={touchedFields.has('price') && isFieldValid('price')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Стоимость доставки */}
        <div className="space-y-2">
          <Label htmlFor="delivery_price" className={isMobile ? "text-base font-medium" : ""}>
            Стоимость доставки ($)
          </Label>
          <TouchOptimizedInput 
            id="delivery_price"
            type="number"
            min="0"
            step="0.01"
            value={formData.delivery_price}
            onChange={(e) => onInputChange('delivery_price', e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
          />
        </div>

        {/* Количество мест для отправки */}
        <div className="space-y-2">
          <Label htmlFor="place_number" className={isMobile ? "text-base font-medium" : ""}>
            Количество мест для отправки
          </Label>
          <TouchOptimizedInput 
            id="place_number"
            type="number"
            min="1"
            value={formData.place_number || '1'}
            onChange={(e) => onInputChange('place_number', e.target.value)}
            placeholder="1"
            inputMode="numeric"
          />
        </div>
      </div>

      {/* Покупатель */}
      <div className="space-y-2">
        <Label htmlFor="buyerOptId" className={isMobile ? "text-base font-medium" : ""}>
          Покупатель *
        </Label>
        <Select
          value={formData.buyerOptId}
          onValueChange={(value) => onInputChange('buyerOptId', value)}
          disabled={isBuyersLoading}
        >
          <SelectTrigger className={isMobile ? "h-12 text-base" : ""}>
            <SelectValue placeholder={isBuyersLoading ? "Загрузка..." : "Выберите покупателя"} />
          </SelectTrigger>
          <SelectContent>
            {buyers
              .sort((a, b) => (a.opt_id || '').localeCompare(b.opt_id || ''))
              .map((buyer) => (
                <SelectItem key={buyer.id} value={buyer.opt_id || buyer.id}>
                  {buyer.opt_id ? `${buyer.opt_id} - ${buyer.full_name || buyer.email}` : (buyer.full_name || buyer.email)}
                </SelectItem>
              ))}
            {buyers.length === 0 && !isBuyersLoading && (
              <div className="py-2 px-3 text-sm text-gray-500">
                Покупатели не найдены
              </div>
            )}
          </SelectContent>
        </Select>
        {getFieldError('buyerOptId') && (
          <p className="text-sm text-red-500">{getFieldError('buyerOptId')}</p>
        )}
      </div>

      {/* Информация об автомобиле */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Информация об автомобиле</h4>
        
        <SimpleCarSelector
          brandId={formData.brandId}
          modelId={formData.modelId}
          onBrandChange={handleBrandChange}
          onModelChange={handleModelChange}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
};

export default BasicOrderInfoStep;
