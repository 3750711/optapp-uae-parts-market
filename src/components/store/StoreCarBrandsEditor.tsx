
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useCarBrandsAndModels } from '@/hooks/useCarBrandsAndModels';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StoreCarBrandsEditorProps {
  storeId: string;
  onSaved?: () => void;
}

const StoreCarBrandsEditor: React.FC<StoreCarBrandsEditorProps> = ({ storeId, onSaved }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCarBrands, setSelectedCarBrands] = useState<string[]>([]);
  const [selectedCarModels, setSelectedCarModels] = useState<{[brandId: string]: string[]}>({});
  const [selectedBrandForModels, setSelectedBrandForModels] = useState<string | null>(null);
  const [selectAllModels, setSelectAllModels] = useState(false);

  const { 
    brands: allCarBrands,
    brandModels: allCarModels,
    selectBrand,
    isLoading: isBrandsLoading
  } = useCarBrandsAndModels();

  useEffect(() => {
    const fetchStoreCarData = async () => {
      if (!storeId) return;

      setIsLoading(true);
      try {
        // Fetch car brands associated with this store
        const { data: storeBrands, error: brandsError } = await supabase
          .from('store_car_brands')
          .select('car_brand_id')
          .eq('store_id', storeId);

        if (brandsError) throw brandsError;

        // Fetch car models associated with this store
        const { data: storeModels, error: modelsError } = await supabase
          .from('store_car_models')
          .select('car_model_id, car_models(id, brand_id)')
          .eq('store_id', storeId);

        if (modelsError) throw modelsError;

        // Set selected brands
        const brandIds = storeBrands.map(item => item.car_brand_id);
        setSelectedCarBrands(brandIds);

        // Group models by brand
        const modelsByBrand: {[brandId: string]: string[]} = {};
        storeModels.forEach(item => {
          const brandId = item.car_models?.brand_id;
          const modelId = item.car_model_id;
          
          if (brandId) {
            if (!modelsByBrand[brandId]) {
              modelsByBrand[brandId] = [];
            }
            modelsByBrand[brandId].push(modelId);
          }
        });
        
        setSelectedCarModels(modelsByBrand);
      } catch (error) {
        console.error('Error fetching store car data:', error);
        toast.error('Не удалось загрузить данные о моделях автомобилей');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreCarData();
  }, [storeId]);

  const handleToggleCarBrand = (brandId: string) => {
    setSelectedCarBrands(prev => {
      if (prev.includes(brandId)) {
        // If removing a brand, also remove all its models
        setSelectedCarModels(prevModels => {
          const newModels = { ...prevModels };
          delete newModels[brandId];
          return newModels;
        });
        
        if (selectedBrandForModels === brandId) {
          setSelectedBrandForModels(null);
        }
        
        return prev.filter(id => id !== brandId);
      } else {
        return [...prev, brandId];
      }
    });
  };

  const handleToggleCarModel = (modelId: string, brandId: string) => {
    setSelectedCarModels(prev => {
      const currentBrandModels = prev[brandId] || [];
      
      if (currentBrandModels.includes(modelId)) {
        return {
          ...prev,
          [brandId]: currentBrandModels.filter(id => id !== modelId)
        };
      } else {
        return {
          ...prev,
          [brandId]: [...currentBrandModels, modelId]
        };
      }
    });
  };

  const handleToggleSelectAllModels = () => {
    if (!selectedBrandForModels) return;
    
    const newSelectAllModels = !selectAllModels;
    setSelectAllModels(newSelectAllModels);
    
    if (newSelectAllModels) {
      // Select all models for the current brand
      setSelectedCarModels(prev => ({
        ...prev,
        [selectedBrandForModels]: allCarModels.map(model => model.id)
      }));
    } else {
      // Deselect all models for the current brand
      setSelectedCarModels(prev => {
        const newModels = { ...prev };
        newModels[selectedBrandForModels] = [];
        return newModels;
      });
    }
  };

  const handleSave = async () => {
    if (!storeId) return;
    
    setIsSaving(true);
    try {
      // Update car brands
      if (selectedCarBrands.length > 0) {
        // First delete existing associations
        await supabase
          .from('store_car_brands')
          .delete()
          .eq('store_id', storeId);
          
        // Then add new associations
        const brandInserts = selectedCarBrands.map(brandId => ({
          store_id: storeId,
          car_brand_id: brandId
        }));
        
        const { error: brandError } = await supabase
          .from('store_car_brands')
          .insert(brandInserts);
          
        if (brandError) throw brandError;
      }
      
      // Update car models
      // First delete existing associations
      await supabase
        .from('store_car_models')
        .delete()
        .eq('store_id', storeId);
        
      // Then add new associations
      const modelInserts: {store_id: string, car_model_id: string}[] = [];
      
      Object.keys(selectedCarModels).forEach(brandId => {
        selectedCarModels[brandId].forEach(modelId => {
          modelInserts.push({
            store_id: storeId,
            car_model_id: modelId
          });
        });
      });
      
      if (modelInserts.length > 0) {
        const { error: modelError } = await supabase
          .from('store_car_models')
          .insert(modelInserts);
          
        if (modelError) throw modelError;
      }
      
      toast.success('Марки и модели автомобилей успешно сохранены');
      if (onSaved) onSaved();
      
    } catch (error) {
      console.error('Error saving car brands and models:', error);
      toast.error('Ошибка при сохранении марок и моделей автомобилей');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Марки и модели автомобилей
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Загрузка данных...</div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Выберите марки автомобилей, с которыми работает ваш магазин:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {allCarBrands.map((brand) => (
                  <div key={brand.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`brand-${brand.id}`}
                      checked={selectedCarBrands.includes(brand.id)}
                      onCheckedChange={() => handleToggleCarBrand(brand.id)}
                    />
                    <Label
                      htmlFor={`brand-${brand.id}`}
                      className="text-sm font-medium leading-none"
                    >
                      {brand.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Выберите модели для выбранных марок:</h3>
                {selectedCarBrands.length > 0 && (
                  <Select 
                    value={selectedBrandForModels || ''} 
                    onValueChange={(value) => {
                      setSelectedBrandForModels(value);
                      selectBrand(value);
                      // Check if we should show all models as selected
                      const brandModels = selectedCarModels[value] || [];
                      const allModelsForBrand = allCarModels.filter(model => model.brand_id === value);
                      setSelectAllModels(
                        allModelsForBrand.length > 0 && 
                        brandModels.length === allModelsForBrand.length
                      );
                    }}
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
              
              {selectedBrandForModels ? (
                <div className="border rounded-md p-3">
                  {isBrandsLoading ? (
                    <div className="text-center py-2">Загрузка моделей...</div>
                  ) : allCarModels.length > 0 ? (
                    <ScrollArea className="h-[200px]">
                      <div className="grid grid-cols-2 gap-2">
                        {allCarModels.map((model) => (
                          <div key={model.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`model-${model.id}`}
                              checked={(selectedCarModels[selectedBrandForModels] || []).includes(model.id)}
                              onCheckedChange={() => handleToggleCarModel(model.id, selectedBrandForModels)}
                            />
                            <Label
                              htmlFor={`model-${model.id}`}
                              className="text-sm leading-none"
                            >
                              {model.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-2 text-sm text-muted-foreground">
                      Нет доступных моделей для этой марки
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  {selectedCarBrands.length === 0 
                    ? "Сначала выберите хотя бы одну марку автомобиля" 
                    : "Выберите марку для отображения доступных моделей"}
                </div>
              )}
            </div>

            <Button 
              className="w-full" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Сохранение...' : 'Сохранить марки и модели'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StoreCarBrandsEditor;
