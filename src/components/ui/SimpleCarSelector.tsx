
import React, { useState, useMemo } from 'react';
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
  className?: string;
}

const SimpleCarSelector: React.FC<SimpleCarSelectorProps> = ({
  brandId,
  modelId,
  onBrandChange,
  onModelChange,
  isMobile = false,
  disabled = false,
  className = ""
}) => {
  const [searchBrandTerm, setSearchBrandTerm] = useState('');
  const [searchModelTerm, setSearchModelTerm] = useState('');

  const {
    brands,
    brandModels,
    selectedBrand,
    selectBrand,
    findBrandNameById,
    findModelNameById,
    isLoading
  } = useCarBrandsAndModels();

  // Простая фильтрация брендов
  const filteredBrands = useMemo(() => {
    if (!searchBrandTerm) return brands;
    return brands.filter(brand => 
      brand.name.toLowerCase().includes(searchBrandTerm.toLowerCase())
    );
  }, [brands, searchBrandTerm]);

  // Простая фильтрация моделей
  const filteredModels = useMemo(() => {
    if (!searchModelTerm) return brandModels;
    return brandModels.filter(model => 
      model.name.toLowerCase().includes(searchModelTerm.toLowerCase())
    );
  }, [brandModels, searchModelTerm]);

  const handleBrandChange = (selectedBrandId: string) => {
    const brandName = findBrandNameById(selectedBrandId);
    if (brandName) {
      selectBrand(selectedBrandId);
      onBrandChange(selectedBrandId, brandName);
      // Сбрасываем модель при смене бренда
      onModelChange('', '');
      setSearchModelTerm('');
    }
  };

  const handleModelChange = (selectedModelId: string) => {
    const modelName = findModelNameById(selectedModelId);
    if (modelName) {
      onModelChange(selectedModelId, modelName);
    }
  };

  // Синхронизация выбранного бренда
  React.useEffect(() => {
    if (brandId && brandId !== selectedBrand) {
      selectBrand(brandId);
    }
  }, [brandId, selectedBrand, selectBrand]);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {/* Бренд */}
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
          <SelectContent 
            className="bg-white border border-gray-200 shadow-md max-h-60"
            showSearch={true}
            searchPlaceholder="Поиск бренда..."
            searchValue={searchBrandTerm}
            onSearchChange={setSearchBrandTerm}
          >
            {filteredBrands.map((brand) => (
              <SelectItem 
                key={brand.id} 
                value={brand.id}
                className={isMobile ? "py-3 text-base" : ""}
              >
                {brand.name}
              </SelectItem>
            ))}
            {filteredBrands.length === 0 && (
              <div className="py-2 px-3 text-sm text-gray-500">
                Бренд не найден
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Модель */}
      <div className="space-y-2">
        <Label htmlFor="model" className={isMobile ? "text-base font-medium" : ""}>
          Модель
        </Label>
        <Select
          value={modelId}
          onValueChange={handleModelChange}
          disabled={isLoading || !brandId || disabled}
        >
          <SelectTrigger className={isMobile ? "h-12 text-base" : ""}>
            <SelectValue placeholder={brandId ? "Выберите модель" : "Сначала выберите бренд"} />
          </SelectTrigger>
          <SelectContent 
            className="bg-white border border-gray-200 shadow-md max-h-60"
            showSearch={true}
            searchPlaceholder="Поиск модели..."
            searchValue={searchModelTerm}
            onSearchChange={setSearchModelTerm}
          >
            {filteredModels.map((model) => (
              <SelectItem 
                key={model.id} 
                value={model.id}
                className={isMobile ? "py-3 text-base" : ""}
              >
                {model.name}
              </SelectItem>
            ))}
            {filteredModels.length === 0 && brandId && (
              <div className="py-2 px-3 text-sm text-gray-500">
                Модель не найдена
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default SimpleCarSelector;
