
import React, { useState, useEffect } from 'react';
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
    brandModels,
    selectBrand,
    findBrandNameById,
    findModelNameById,
    isLoading: isLoadingCarData
  } = useCarBrandsAndModels();

  // Оптимизированный поиск
  const {
    filteredBrands,
    filteredModels,
    hasValidBrands,
    hasValidModels
  } = useOptimizedBrandSearch(
    brands,
    brandModels,
    searchBrandTerm,
    searchModelTerm,
    brandId // Используем brandId напрямую из пропсов
  );

  // Синхронизация выбранного бренда
  useEffect(() => {
    if (brandId && brandId !== '') {
      selectBrand(brandId);
    }
  }, [brandId, selectBrand]);

  const handleBrandChange = (selectedBrandId: string) => {
    if (!selectedBrandId || !hasValidBrands) return;
    
    const brandName = findBrandNameById(selectedBrandId);
    if (brandName) {
      onBrandChange(selectedBrandId, brandName);
      selectBrand(selectedBrandId);
      
      // Сбрасываем модель при смене бренда
      onModelChange('', '');
    }
  };

  const handleModelChange = (selectedModelId: string) => {
    if (!selectedModelId || !hasValidModels) return;
    
    const modelName = findModelNameById(selectedModelId);
    if (modelName) {
      onModelChange(selectedModelId, modelName);
    }
  };

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
          onSearchChange={setSearchBrandTerm}
          showResultCount={true}
        />
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
          disabled={!brandId || isLoadingCarData || !hasValidModels}
          className={isMobile ? "h-12" : ""}
          searchTerm={searchModelTerm}
          onSearchChange={setSearchModelTerm}
          showResultCount={true}
        />
      </div>
    </div>
  );
};

export default CarBrandModelSelector;
