
import React, { useState, useMemo, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car } from 'lucide-react';
import { useCarBrandsAndModels } from '@/hooks/useCarBrandsAndModels';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StoreCarBrandsEditorProps {
  storeId: string;
}

const StoreCarBrandsEditor: React.FC<StoreCarBrandsEditorProps> = ({ storeId }) => {
  const [selectedBrandForModels, setSelectedBrandForModels] = useState<string | null>(null);
  const [selectedCarBrands, setSelectedCarBrands] = useState<string[]>([]);
  const [selectedCarModels, setSelectedCarModels] = useState<{[brandId: string]: string[]}>({});
  
  const { 
    brands: allCarBrands,
    allModels: allCarModels,
    isLoading: isBrandsLoading
  } = useCarBrandsAndModels();

  // Load existing store car brands and models
  useEffect(() => {
    const loadStoreBrands = async () => {
      if (!storeId) return;
      
      try {
        const { data: storeBrands, error } = await supabase
          .from('store_car_brands')
          .select('car_brand_id, car_model_id')
          .eq('store_id', storeId);

        if (error) {
          console.error('Error loading store brands:', error);
          return;
        }

        const brandIds = [...new Set(storeBrands?.map(sb => sb.car_brand_id) || [])];
        setSelectedCarBrands(brandIds);

        const modelsByBrand: {[brandId: string]: string[]} = {};
        storeBrands?.forEach(sb => {
          if (sb.car_model_id) {
            if (!modelsByBrand[sb.car_brand_id]) {
              modelsByBrand[sb.car_brand_id] = [];
            }
            modelsByBrand[sb.car_brand_id].push(sb.car_model_id);
          }
        });
        setSelectedCarModels(modelsByBrand);
      } catch (error) {
        console.error('Error loading store brands:', error);
      }
    };

    loadStoreBrands();
  }, [storeId]);

  // Get models for selected brand
  const modelsForSelectedBrand = useMemo(() => {
    if (!selectedBrandForModels || !allCarModels) return [];
    return allCarModels.filter(model => model.brand_id === selectedBrandForModels);
  }, [selectedBrandForModels, allCarModels]);

  const handleBrandForModelsSelect = (brandId: string) => {
    setSelectedBrandForModels(brandId);
  };

  const onToggleCarBrand = async (brandId: string) => {
    const isSelected = selectedCarBrands.includes(brandId);
    let newSelectedBrands: string[];

    if (isSelected) {
      // Remove brand
      newSelectedBrands = selectedCarBrands.filter(id => id !== brandId);
      
      // Remove all models for this brand
      const newSelectedModels = { ...selectedCarModels };
      delete newSelectedModels[brandId];
      setSelectedCarModels(newSelectedModels);

      // Delete from database
      try {
        const { error } = await supabase
          .from('store_car_brands')
          .delete()
          .eq('store_id', storeId)
          .eq('car_brand_id', brandId);

        if (error) {
          console.error('Error removing brand:', error);
          toast.error('Ошибка при удалении марки');
          return;
        }
      } catch (error) {
        console.error('Error removing brand:', error);
        return;
      }
    } else {
      // Add brand
      newSelectedBrands = [...selectedCarBrands, brandId];

      // Add to database
      try {
        const { error } = await supabase
          .from('store_car_brands')
          .insert({
            store_id: storeId,
            car_brand_id: brandId,
            car_model_id: null
          });

        if (error) {
          console.error('Error adding brand:', error);
          toast.error('Ошибка при добавлении марки');
          return;
        }
      } catch (error) {
        console.error('Error adding brand:', error);
        return;
      }
    }

    setSelectedCarBrands(newSelectedBrands);
  };

  const onToggleCarModel = async (modelId: string, brandId: string) => {
    const currentModels = selectedCarModels[brandId] || [];
    const isSelected = currentModels.includes(modelId);

    if (isSelected) {
      // Remove model
      const newModels = currentModels.filter(id => id !== modelId);
      setSelectedCarModels({
        ...selectedCarModels,
        [brandId]: newModels
      });

      // Delete from database
      try {
        const { error } = await supabase
          .from('store_car_brands')
          .delete()
          .eq('store_id', storeId)
          .eq('car_brand_id', brandId)
          .eq('car_model_id', modelId);

        if (error) {
          console.error('Error removing model:', error);
          toast.error('Ошибка при удалении модели');
        }
      } catch (error) {
        console.error('Error removing model:', error);
      }
    } else {
      // Add model
      const newModels = [...currentModels, modelId];
      setSelectedCarModels({
        ...selectedCarModels,
        [brandId]: newModels
      });

      // Add to database
      try {
        const { error } = await supabase
          .from('store_car_brands')
          .insert({
            store_id: storeId,
            car_brand_id: brandId,
            car_model_id: modelId
          });

        if (error) {
          console.error('Error adding model:', error);
          toast.error('Ошибка при добавлении модели');
        }
      } catch (error) {
        console.error('Error adding model:', error);
      }
    }
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
