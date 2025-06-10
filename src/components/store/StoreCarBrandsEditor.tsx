
import React, { useState, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car } from 'lucide-react';
import { useCarBrandsAndModels } from '@/hooks/useCarBrandsAndModels';

interface StoreCarBrandsEditorProps {
  selectedCarBrands: string[];
  selectedCarModels: {[brandId: string]: string[]};
  onToggleCarBrand: (brandId: string) => void;
  onToggleCarModel: (modelId: string, brandId: string) => void;
}

const StoreCarBrandsEditor: React.FC<StoreCarBrandsEditorProps> = ({
  selectedCarBrands,
  selectedCarModels,
  onToggleCarBrand,
  onToggleCarModel
}) => {
  const [selectedBrandForModels, setSelectedBrandForModels] = useState<string | null>(null);
  
  const { 
    brands: allCarBrands,
    allModels: allCarModels,
    isLoading: isBrandsLoading
  } = useCarBrandsAndModels();

  // Get models for selected brand
  const modelsForSelectedBrand = useMemo(() => {
    if (!selectedBrandForModels || !allCarModels) return [];
    return allCarModels.filter(model => model.brand_id === selectedBrandForModels);
  }, [selectedBrandForModels, allCarModels]);

  const handleBrandForModelsSelect = (brandId: string) => {
    setSelectedBrandForModels(brandId);
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-center gap-2">
        <Car className="h-4 w-4" />
        <h3 className="text-sm font-medium">Марки и модели автомобилей</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Выберите марки и модели автомобилей, с которыми работает этот магазин
      </p>
      
      <div className="grid grid-cols-2 gap-2">
        {allCarBrands.map((brand) => (
          <div key={brand.id} className="flex items-center space-x-2">
            <Checkbox
              id={`brand-${brand.id}`}
              checked={selectedCarBrands.includes(brand.id)}
              onCheckedChange={() => onToggleCarBrand(brand.id)}
            />
            <label
              htmlFor={`brand-${brand.id}`}
              className="text-sm font-medium leading-none"
            >
              {brand.name}
            </label>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium">Модели автомобилей</label>
          {selectedCarBrands.length > 0 && (
            <Select 
              value={selectedBrandForModels || ''} 
              onValueChange={handleBrandForModelsSelect}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Выберите марку" />
              </SelectTrigger>
              <SelectContent>
                {selectedCarBrands.map(brandId => {
                  const brand = allCarBrands.find(b => b.id === brandId);
                  return brand ? (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ) : null;
                })}
              </SelectContent>
            </Select>
          )}
        </div>
        
        {selectedBrandForModels && (
          <div className="border rounded-md p-2">
            {isBrandsLoading ? (
              <div className="text-center py-2">Загрузка моделей...</div>
            ) : modelsForSelectedBrand.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                {modelsForSelectedBrand.map((model) => (
                  <div key={model.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`model-${model.id}`}
                      checked={(selectedCarModels[selectedBrandForModels] || []).includes(model.id)}
                      onCheckedChange={() => onToggleCarModel(model.id, selectedBrandForModels)}
                    />
                    <label
                      htmlFor={`model-${model.id}`}
                      className="text-sm leading-none"
                    >
                      {model.name}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 text-sm text-muted-foreground">
                Нет доступных моделей для этой марки
              </div>
            )}
          </div>
        )}
        
        {!selectedBrandForModels && selectedCarBrands.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Выберите марку для отображения моделей
          </div>
        )}
        
        {selectedCarBrands.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Сначала выберите хотя бы одну марку автомобиля
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreCarBrandsEditor;
