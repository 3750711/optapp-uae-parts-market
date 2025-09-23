import React, { useState, useCallback, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import EnhancedVirtualizedSelect from '@/components/ui/EnhancedVirtualizedSelect';
import { useAllCarBrands } from '@/hooks/useAllCarBrands';

interface CarBrandModelSelectorProps {
  brandId: string;
  modelId: string;
  onBrandChange: (brandId: string, brandName: string) => void;
  onModelChange: (modelId: string, modelName: string) => void;
  isMobile?: boolean;
}

const CarBrandModelSelector: React.FC<CarBrandModelSelectorProps> = ({
  brandId,
  modelId,
  onBrandChange,
  onModelChange,
  isMobile = false
}) => {
  const {
    brands,
    brandModels,
    allModels,
    selectBrand,
    isLoading: isLoadingCarData
  } = useAllCarBrands();

  useEffect(() => {
    if (brandId) {
      selectBrand(brandId);
    }
  }, [brandId, selectBrand]);
  
  const handleBrandChange = useCallback((selectedBrandId: string) => {
    const brand = brands.find(b => b.id === selectedBrandId);
    if (brand) {
      onBrandChange(selectedBrandId, brand.name);
      // Сбрасываем модель при смене бренда
      onModelChange('', '');
    }
  }, [brands, onBrandChange, onModelChange]);

  const handleModelChange = useCallback((selectedModelId: string) => {
    const model = brandModels.find(m => m.id === selectedModelId);
    if (model) {
      onModelChange(selectedModelId, model.name);
    }
  }, [brandModels, onModelChange]);

  const hasValidBrands = brands.length > 0;
  const isModelDisabled = !brandId || isLoadingCarData;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Бренд с поиском */}
      <div className="space-y-2">
        <Label htmlFor="brand" className={isMobile ? "text-base font-medium" : ""}>
          Бренд
        </Label>
        <EnhancedVirtualizedSelect
          options={brands}
          value={brandId}
          onValueChange={handleBrandChange}
          placeholder="Выберите бренд"
          searchPlaceholder="Поиск бренда..."
          disabled={isLoadingCarData || !hasValidBrands}
          className={isMobile ? "h-12" : ""}
        />
        {isLoadingCarData && (
          <p className="text-xs text-gray-500">Загрузка брендов...</p>
        )}
        {!isLoadingCarData && !hasValidBrands && (
          <p className="text-xs text-red-500">Бренды не найдены</p>
        )}
      </div>

      {/* Модель с поиском */}
      <div className="space-y-2">
        <Label htmlFor="model" className={isMobile ? "text-base font-medium" : ""}>
          Модель
        </Label>
        <EnhancedVirtualizedSelect
          options={brandModels}
          value={modelId}
          onValueChange={handleModelChange}
          placeholder={brandId ? "Выберите модель" : "Сначала выберите бренд"}
          searchPlaceholder="Поиск модели..."
          disabled={isModelDisabled}
          className={isMobile ? "h-12" : ""}
        />
        {isLoadingCarData && brandId && (
          <p className="text-xs text-gray-500">Загрузка моделей...</p>
        )}
        {!isLoadingCarData && brandId && brandModels.length === 0 && (
          <p className="text-xs text-red-500">Модели для данного бренда не найдены</p>
        )}
      </div>
    </div>
  );
};

export default CarBrandModelSelector;
