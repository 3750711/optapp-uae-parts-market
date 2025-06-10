
import React, { useState, useMemo, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import EnhancedVirtualizedSelect from '@/components/ui/EnhancedVirtualizedSelect';
import { useCarBrandsAndModels } from '@/hooks/useCarBrandsAndModels';
import { useOptimizedBrandSearch } from '@/hooks/useOptimizedBrandSearch';

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
  const [searchBrandTerm, setSearchBrandTerm] = useState('');
  const [searchModelTerm, setSearchModelTerm] = useState('');

  const {
    brands,
    allModels,
    findBrandNameById,
    findModelNameById,
    isLoading: isLoadingCarData
  } = useCarBrandsAndModels();

  // Фильтруем модели для выбранного бренда
  const filteredModelsByBrand = useMemo(() => {
    if (!brandId || !allModels || allModels.length === 0) {
      return [];
    }
    return allModels.filter(model => model.brand_id === brandId);
  }, [allModels, brandId]);

  // Оптимизированный поиск
  const {
    filteredBrands,
    filteredModels,
    hasValidBrands,
    hasValidModels
  } = useOptimizedBrandSearch(
    brands,
    filteredModelsByBrand,
    searchBrandTerm,
    searchModelTerm
  );

  const handleBrandChange = useCallback((selectedBrandId: string) => {
    if (!selectedBrandId || !hasValidBrands) return;
    
    const brandName = findBrandNameById(selectedBrandId);
    if (brandName) {
      onBrandChange(selectedBrandId, brandName);
      // Сбрасываем модель при смене бренда
      onModelChange('', '');
      // Сбрасываем поиск модели
      setSearchModelTerm('');
    }
  }, [hasValidBrands, findBrandNameById, onBrandChange, onModelChange]);

  const handleModelChange = useCallback((selectedModelId: string) => {
    if (!selectedModelId || !hasValidModels) return;
    
    const modelName = findModelNameById(selectedModelId);
    if (modelName) {
      onModelChange(selectedModelId, modelName);
    }
  }, [hasValidModels, findModelNameById, onModelChange]);

  // Мемоизированные обработчики поиска
  const handleBrandSearchChange = useCallback((term: string) => {
    setSearchBrandTerm(term);
  }, []);

  const handleModelSearchChange = useCallback((term: string) => {
    setSearchModelTerm(term);
  }, []);

  const isModelDisabled = !brandId || isLoadingCarData || !hasValidModels;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Бренд с поиском */}
      <div className="space-y-2">
        <Label htmlFor="brand" className={isMobile ? "text-base font-medium" : ""}>
          Бренд
        </Label>
        <EnhancedVirtualizedSelect
          options={filteredBrands}
          value={brandId}
          onValueChange={handleBrandChange}
          placeholder="Выберите бренд"
          searchPlaceholder="Поиск бренда..."
          disabled={isLoadingCarData || !hasValidBrands}
          className={isMobile ? "h-12" : ""}
          searchTerm={searchBrandTerm}
          onSearchChange={handleBrandSearchChange}
          showResultCount={true}
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
          options={filteredModels}
          value={modelId}
          onValueChange={handleModelChange}
          placeholder={brandId ? "Выберите модель" : "Сначала выберите бренд"}
          searchPlaceholder="Поиск модели..."
          disabled={isModelDisabled}
          className={isMobile ? "h-12" : ""}
          searchTerm={searchModelTerm}
          onSearchChange={handleModelSearchChange}
          showResultCount={true}
        />
        {isLoadingCarData && brandId && (
          <p className="text-xs text-gray-500">Загрузка моделей...</p>
        )}
        {!isLoadingCarData && brandId && !hasValidModels && (
          <p className="text-xs text-red-500">Модели для данного бренда не найдены</p>
        )}
      </div>
    </div>
  );
};

export default CarBrandModelSelector;
