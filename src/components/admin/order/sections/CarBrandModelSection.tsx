
import React from "react";
import { Label } from "@/components/ui/label";
import EnhancedVirtualizedSelect from "@/components/ui/EnhancedVirtualizedSelect";

interface CarBrandModelSectionProps {
  brandId: string;
  modelId: string;
  onBrandChange: (brandId: string, brandName: string) => void;
  onModelChange: (modelId: string, modelName: string) => void;
  brands: { id: string; name: string }[];
  filteredModels: { id: string; name: string; brand_id: string }[];
  isLoadingCarData: boolean;
  searchBrandTerm: string;
  setSearchBrandTerm: (term: string) => void;
  searchModelTerm: string;
  setSearchModelTerm: (term: string) => void;
  filteredBrands: { id: string; name: string }[];
  disabled?: boolean;
}

export const CarBrandModelSection: React.FC<CarBrandModelSectionProps> = ({
  brandId,
  modelId,
  onBrandChange,
  onModelChange,
  brands,
  filteredModels,
  isLoadingCarData,
  searchBrandTerm,
  setSearchBrandTerm,
  searchModelTerm,
  setSearchModelTerm,
  filteredBrands,
  disabled = false,
}) => {
  console.log('🏷️ CarBrandModelSection render:', {
    brandId,
    modelId,
    brandsCount: filteredBrands.length,
    modelsCount: filteredModels.length,
    isLoadingCarData
  });

  const handleBrandSelect = (selectedBrandId: string) => {
    const brand = brands.find(b => b.id === selectedBrandId);
    if (brand) {
      console.log('🏷️ Brand selected:', brand);
      onBrandChange(selectedBrandId, brand.name);
    }
  };

  const handleModelSelect = (selectedModelId: string) => {
    const model = filteredModels.find(m => m.id === selectedModelId);
    if (model) {
      console.log('🚗 Model selected:', model);
      onModelChange(selectedModelId, model.name);
    }
  };

  const hasValidBrands = filteredBrands.length > 0;
  const isModelDisabled = !brandId || isLoadingCarData || disabled;
  const hasValidModels = filteredModels.length > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="brandId" className="text-base font-medium">
          Бренд
        </Label>
        <EnhancedVirtualizedSelect
          options={filteredBrands}
          value={brandId}
          onValueChange={handleBrandSelect}
          placeholder="Выберите бренд"
          searchPlaceholder="Поиск бренда..."
          disabled={isLoadingCarData || disabled || !hasValidBrands}
          className="bg-white"
        />
        {isLoadingCarData && (
          <p className="text-xs text-gray-500">Загрузка брендов...</p>
        )}
        {!isLoadingCarData && !hasValidBrands && (
          <p className="text-xs text-red-500">Бренды не найдены</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="modelId" className="text-base font-medium">
          Модель
        </Label>
        <EnhancedVirtualizedSelect
          options={filteredModels}
          value={modelId}
          onValueChange={handleModelSelect}
          placeholder={brandId ? "Выберите модель" : "Сначала выберите бренд"}
          searchPlaceholder="Поиск модели..."
          disabled={isModelDisabled}
          className="bg-white"
        />
        {isLoadingCarData && brandId && (
          <p className="text-xs text-gray-500">Загрузка моделей...</p>
        )}
        {!isLoadingCarData && brandId && !hasValidModels && (
          <p className="text-xs text-red-500">Модели для данного бренда не найдены</p>
        )}
        {!brandId && (
          <p className="text-xs text-gray-400">Выберите бренд для загрузки моделей</p>
        )}
      </div>
    </div>
  );
};
