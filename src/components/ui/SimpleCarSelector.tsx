
import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCarBrandsAndModels } from '@/hooks/useCarBrandsAndModels';

interface SimpleCarSelectorProps {
  brandId: string;
  modelId: string;
  onBrandChange: (brandId: string, brandName: string) => void;
  onModelChange: (modelId: string, modelName: string) => void;
  isMobile?: boolean;
  disabled?: boolean;
}

const SimpleCarSelector: React.FC<SimpleCarSelectorProps> = ({
  brandId,
  modelId,
  onBrandChange,
  onModelChange,
  isMobile = false,
  disabled = false
}) => {
  const {
    brands,
    allModels,
    isLoading,
    findBrandNameById,
    findModelNameById
  } = useCarBrandsAndModels();

  // Фильтрация моделей по выбранному бренду
  const filteredModels = useMemo(() => {
    if (!brandId) return [];
    return allModels.filter(model => model.brand_id === brandId);
  }, [allModels, brandId]);

  const handleBrandChange = (selectedBrandId: string) => {
    const brandName = findBrandNameById(selectedBrandId);
    if (brandName) {
      onBrandChange(selectedBrandId, brandName);
      // Сбрасываем модель при смене бренда
      onModelChange('', '');
    }
  };

  const handleModelChange = (selectedModelId: string) => {
    const modelName = findModelNameById(selectedModelId);
    if (modelName) {
      onModelChange(selectedModelId, modelName);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="brand" className={isMobile ? "text-base font-medium" : ""}>
          Бренд
        </Label>
        <Select
          value={brandId}
          onValueChange={handleBrandChange}
          disabled={isLoading || disabled}
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="model" className={isMobile ? "text-base font-medium" : ""}>
          Модель
        </Label>
        <Select
          value={modelId}
          onValueChange={handleModelChange}
          disabled={isLoading || disabled || !brandId}
        >
          <SelectTrigger className={isMobile ? "h-12 text-base" : ""}>
            <SelectValue placeholder={brandId ? "Выберите модель" : "Сначала выберите бренд"} />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-md max-h-60">
            {filteredModels.map((model) => (
              <SelectItem 
                key={model.id} 
                value={model.id}
                className={isMobile ? "py-3 text-base" : ""}
              >
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default SimpleCarSelector;
