
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import TouchOptimizedInput from '@/components/ui/TouchOptimizedInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { OrderFormData } from '@/hooks/useOrderForm';
import { useCarBrandsAndModels } from '@/hooks/useCarBrandsAndModels';
import { useOptimizedBrandSearch } from '@/hooks/useOptimizedBrandSearch';
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
  const [searchBrandTerm, setSearchBrandTerm] = useState('');
  const [searchModelTerm, setSearchModelTerm] = useState('');

  // Загружаем покупателей напрямую из Supabase
  const { data: buyers = [] } = useQuery({
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

  // Загружаем бренды и модели
  const {
    brands,
    brandModels,
    selectBrand,
    findBrandNameById,
    findModelNameById
  } = useCarBrandsAndModels();

  // Оптимизированный поиск
  const {
    filteredBrands,
    filteredModels
  } = useOptimizedBrandSearch(
    brands,
    brandModels,
    searchBrandTerm,
    searchModelTerm,
    formData.brandId
  );

  const handleBrandChange = (brandId: string) => {
    onInputChange('brandId', brandId);
    const brandName = findBrandNameById(brandId);
    if (brandName) {
      onInputChange('brand', brandName);
    }
    // Сбрасываем модель при смене бренда
    onInputChange('modelId', '');
    onInputChange('model', '');
    selectBrand(brandId);
  };

  const handleModelChange = (modelId: string) => {
    onInputChange('modelId', modelId);
    const modelName = findModelNameById(modelId);
    if (modelName) {
      onInputChange('model', modelName);
    }
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
            className={!isFieldValid('title') && touchedFields.has('title') ? "border-red-500" : ""}
          />
          {getFieldError('title') && (
            <p className="text-sm text-red-500">{getFieldError('title')}</p>
          )}
        </div>

        {/* Цена */}
        <div className="space-y-2">
          <Label htmlFor="price" className={isMobile ? "text-base font-medium" : ""}>
            Цена *
          </Label>
          <TouchOptimizedInput 
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) => onInputChange('price', e.target.value)}
            placeholder="0.00"
            className={!isFieldValid('price') && touchedFields.has('price') ? "border-red-500" : ""}
          />
          {getFieldError('price') && (
            <p className="text-sm text-red-500">{getFieldError('price')}</p>
          )}
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
        >
          <SelectTrigger className={isMobile ? "h-12 text-base" : ""}>
            <SelectValue placeholder="Выберите покупателя" />
          </SelectTrigger>
          <SelectContent>
            {buyers.map((buyer) => (
              <SelectItem key={buyer.id} value={buyer.opt_id || buyer.id}>
                {buyer.full_name || buyer.email} {buyer.opt_id ? `(${buyer.opt_id})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {getFieldError('buyerOptId') && (
          <p className="text-sm text-red-500">{getFieldError('buyerOptId')}</p>
        )}
      </div>

      {/* Информация об автомобиле */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Информация об автомобиле</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Бренд с поиском */}
          <div className="space-y-2">
            <Label htmlFor="brand" className={isMobile ? "text-base font-medium" : ""}>
              Бренд
            </Label>
            <Select
              value={formData.brandId}
              onValueChange={handleBrandChange}
            >
              <SelectTrigger className={isMobile ? "h-12 text-base" : ""}>
                <SelectValue placeholder="Выберите бренд" />
              </SelectTrigger>
              <SelectContent 
                showSearch={true}
                searchPlaceholder="Поиск бренда..."
                searchValue={searchBrandTerm}
                onSearchChange={setSearchBrandTerm}
              >
                {filteredBrands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Модель с поиском */}
          <div className="space-y-2">
            <Label htmlFor="model" className={isMobile ? "text-base font-medium" : ""}>
              Модель
            </Label>
            <Select
              value={formData.modelId}
              onValueChange={handleModelChange}
              disabled={!formData.brandId}
            >
              <SelectTrigger className={isMobile ? "h-12 text-base" : ""}>
                <SelectValue placeholder={formData.brandId ? "Выберите модель" : "Сначала выберите бренд"} />
              </SelectTrigger>
              <SelectContent 
                showSearch={true}
                searchPlaceholder="Поиск модели..."
                searchValue={searchModelTerm}
                onSearchChange={setSearchModelTerm}
              >
                {filteredModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicOrderInfoStep;
