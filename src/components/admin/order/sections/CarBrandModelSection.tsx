
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CarBrandModelSectionProps {
  brandId: string;
  modelId: string;
  onBrandChange: (value: string) => void;
  onModelChange: (value: string) => void;
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="brandId">Бренд</Label>
        <Select
          value={brandId}
          onValueChange={onBrandChange}
          disabled={isLoadingCarData || disabled}
        >
          <SelectTrigger id="brandId" className="bg-white">
            <SelectValue placeholder="Выберите бренд" />
          </SelectTrigger>
          <SelectContent
            showSearch={true}
            searchPlaceholder="Поиск бренда..."
            onSearchChange={setSearchBrandTerm}
            searchValue={searchBrandTerm}
          >
            {filteredBrands.length === 0 ? (
              <SelectItem value="no_data">Нет данных</SelectItem>
            ) : (
              filteredBrands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="modelId">Модель</Label>
        <Select
          value={modelId}
          onValueChange={onModelChange}
          disabled={!brandId || isLoadingCarData || disabled}
        >
          <SelectTrigger id="modelId" className="bg-white">
            <SelectValue placeholder="Выберите модель" />
          </SelectTrigger>
          <SelectContent
            showSearch={true}
            searchPlaceholder="Поиск модели..."
            onSearchChange={setSearchModelTerm}
            searchValue={searchModelTerm}
          >
            {filteredModels.length === 0 ? (
              <SelectItem value="no_data">Нет данных</SelectItem>
            ) : (
              filteredModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
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
