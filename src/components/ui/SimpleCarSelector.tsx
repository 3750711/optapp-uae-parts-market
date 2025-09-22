
import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAllCarBrands } from '@/hooks/useAllCarBrands';
import type { CarBrand, CarModel } from '@/hooks/useLazyCarData';

interface SimpleCarSelectorProps {
  brandId: string;
  modelId: string;
  onBrandChange: (brandId: string, brandName: string) => void;
  onModelChange: (modelId: string, modelName: string) => void;
  isMobile?: boolean;
  disabled?: boolean;
  // Опциональные данные от родительского компонента через useLazyCarData
  // Если не переданы, будет использоваться useAllCarBrands
  brands?: CarBrand[];
  models?: CarModel[];
  isLoadingBrands?: boolean;
  isLoadingModels?: boolean;
  enableBrandsLoading?: () => void;
}

const SimpleCarSelector: React.FC<SimpleCarSelectorProps> = ({
  brandId,
  modelId,
  onBrandChange,
  onModelChange,
  isMobile = false,
  disabled = false,
  brands: externalBrands,
  models: externalModels,
  isLoadingBrands: externalLoadingBrands,
  isLoadingModels: externalLoadingModels,
  enableBrandsLoading: externalEnableBrandsLoading
}) => {
  
  // Fallback к useAllCarBrands если внешние данные не переданы
  const {
    brands: internalBrands,
    allModels: internalAllModels,
    isLoading: internalLoading,
    findBrandNameById,
    findModelNameById
  } = useAllCarBrands();

  // Определяем какие данные использовать
  const brands = externalBrands || internalBrands;
  const isLoadingBrands = externalLoadingBrands ?? internalLoading;
  const isLoadingModels = externalLoadingModels ?? internalLoading;
  
  // Фильтрация моделей для внутреннего useAllCarBrands
  const filteredInternalModels = useMemo(() => {
    if (externalModels) return []; // используем внешние модели
    if (!brandId) return [];
    return internalAllModels.filter(model => model.brand_id === brandId);
  }, [internalAllModels, brandId, externalModels]);
  
  const models = externalModels || filteredInternalModels;

  // Обработчики изменения значений
  const handleBrandChange = (selectedBrandId: string) => {
    if (externalBrands) {
      // Используем внешние данные
      const brand = brands.find(b => b.id === selectedBrandId);
      if (brand) {
        onBrandChange(selectedBrandId, brand.name);
      }
    } else {
      // Используем внутренние данные (useAllCarBrands)
      const brandName = findBrandNameById(selectedBrandId);
      if (brandName) {
        onBrandChange(selectedBrandId, brandName);
        // Сбрасываем модель при смене бренда для внутреннего режима
        onModelChange('', '');
      }
    }
  };

  const handleModelChange = (selectedModelId: string) => {
    if (externalModels) {
      // Используем внешние данные
      const model = models.find(m => m.id === selectedModelId);
      if (model) {
        onModelChange(selectedModelId, model.name);
      }
    } else {
      // Используем внутренние данные (useAllCarBrands)
      const modelName = findModelNameById(selectedModelId);
      if (modelName) {
        onModelChange(selectedModelId, modelName);
      }
    }
  };

  const handleBrandFocus = () => {
    if (externalEnableBrandsLoading) {
      externalEnableBrandsLoading();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="brand" className={isMobile ? "text-base font-medium" : ""}>
          Бренд
        </Label>
        {isLoadingBrands ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select
            value={brandId}
            onValueChange={handleBrandChange}
            onOpenChange={(open) => open && handleBrandFocus()}
            disabled={disabled}
          >
            <SelectTrigger className={isMobile ? "h-12 text-base" : ""}>
              <SelectValue placeholder="Выберите бренд" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-md max-h-60">
              {brands.map((brand) => (
                <SelectItem 
                  key={brand.id} 
                  value={brand.id}
                  className={isMobile ? "py-3 text-base" : ""}
                >
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="model" className={isMobile ? "text-base font-medium" : ""}>
          Модель
        </Label>
        <Select
          value={modelId}
          onValueChange={handleModelChange}
          disabled={disabled || !brandId}
        >
          <SelectTrigger className={isMobile ? "h-12 text-base" : ""}>
            <SelectValue placeholder={
              brandId 
                ? (isLoadingModels ? 'Загрузка моделей...' : 'Выберите модель')
                : 'Сначала выберите бренд'
            } />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-md max-h-60">
            {isLoadingModels ? (
              <SelectItem disabled value="loading">Загрузка моделей...</SelectItem>
            ) : models.length === 0 ? (
              <SelectItem disabled value="empty">Модели не найдены</SelectItem>
            ) : (
              models.map((model) => (
                <SelectItem 
                  key={model.id} 
                  value={model.id}
                  className={isMobile ? "py-3 text-base" : ""}
                >
                  {model.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default SimpleCarSelector;
