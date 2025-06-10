
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useCarBrandsAndModels } from '@/hooks/useCarBrandsAndModels';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Car, ChevronDown, ChevronRight, Check, Search } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

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
  const [searchBrandTerm, setSearchBrandTerm] = useState('');
  const [searchModelTerm, setSearchModelTerm] = useState('');
  const [activeTab, setActiveTab] = useState('brands');
  const [expandedBrands, setExpandedBrands] = useState<{[brandId: string]: boolean}>({});

  const { 
    brands: allCarBrands,
    brandModels: allCarModels,
    selectBrand,
    isLoading: isBrandsLoading
  } = useCarBrandsAndModels();

  // Filter brands based on search term
  const filteredCarBrands = allCarBrands.filter(brand => 
    brand.name.toLowerCase().includes(searchBrandTerm.toLowerCase())
  );

  // Filter models based on search term for the selected brand
  const filteredCarModels = allCarModels.filter(model => 
    model.name.toLowerCase().includes(searchModelTerm.toLowerCase())
  );

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

        // Create expanded state for all selected brands
        const expandedState = brandIds.reduce((acc, brandId) => ({
          ...acc,
          [brandId]: true
        }), {});
        setExpandedBrands(expandedState);

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
        
        // Also remove from expanded brands
        setExpandedBrands(prev => {
          const newExpanded = { ...prev };
          delete newExpanded[brandId];
          return newExpanded;
        });
        
        if (selectedBrandForModels === brandId) {
          setSelectedBrandForModels(null);
        }
        
        return prev.filter(id => id !== brandId);
      } else {
        // When adding a new brand, expand it
        setExpandedBrands(prev => ({
          ...prev,
          [brandId]: true
        }));
        
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

  const handleToggleExpandBrand = (brandId: string) => {
    setExpandedBrands(prev => ({
      ...prev,
      [brandId]: !prev[brandId]
    }));

    // Load models for this brand if it's being expanded
    if (!expandedBrands[brandId]) {
      selectBrand(brandId);
    }
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

  const getSelectedModelCount = (brandId: string) => {
    return selectedCarModels[brandId]?.length || 0;
  };

  const getModelCount = (brandId: string) => {
    return allCarModels.filter(model => model.brand_id === brandId).length;
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

  const renderBrandsList = () => {
    if (isLoading) {
      return <div className="text-center py-4">Загрузка данных...</div>;
    }

    return (
      <div className="space-y-2">
        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск марок автомобилей..."
            className="pl-8"
            value={searchBrandTerm}
            onChange={(e) => setSearchBrandTerm(e.target.value)}
          />
        </div>
        
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-1">
            {filteredCarBrands.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Не найдено марок по запросу "{searchBrandTerm}"
              </div>
            ) : (
              filteredCarBrands.map((brand) => (
                <div key={brand.id} className="rounded-md border mb-2">
                  <div className="flex items-center p-2 cursor-pointer" onClick={() => handleToggleExpandBrand(brand.id)}>
                    <div className="mr-2">
                      {expandedBrands[brand.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                    <Checkbox
                      id={`brand-${brand.id}`}
                      checked={selectedCarBrands.includes(brand.id)}
                      onCheckedChange={() => handleToggleCarBrand(brand.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Label
                      htmlFor={`brand-${brand.id}`}
                      className="ml-2 text-sm font-medium leading-none flex-grow"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {brand.name}
                    </Label>
                    {selectedCarBrands.includes(brand.id) && (
                      <Badge variant="outline" className="ml-2">
                        {getSelectedModelCount(brand.id)}/{getModelCount(brand.id)} моделей
                      </Badge>
                    )}
                  </div>
                  
                  {/* Expandable models section */}
                  {selectedCarBrands.includes(brand.id) && expandedBrands[brand.id] && (
                    <div className="p-2 pt-0 border-t">
                      <div className="pl-6 pt-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-xs mb-2"
                          onClick={() => {
                            selectBrand(brand.id);
                            setSelectedBrandForModels(brand.id);
                            setActiveTab('models');
                          }}
                        >
                          Выбрать модели
                        </Button>
                        
                        {getSelectedModelCount(brand.id) > 0 ? (
                          <div className="text-xs text-muted-foreground">
                            Выбрано моделей: {getSelectedModelCount(brand.id)}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            Нет выбранных моделей
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  const renderModelsList = () => {
    if (isLoading || isBrandsLoading) {
      return <div className="text-center py-4">Загрузка данных...</div>;
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Выберите модели для марки:</h3>
            <Select 
              value={selectedBrandForModels || ''}
              onValueChange={(value) => {
                setSelectedBrandForModels(value);
                selectBrand(value);
                setSearchModelTerm('');
                
                // Check if we should show all models as selected
                const brandModels = selectedCarModels[value] || [];
                const allModelsForBrand = allCarModels.filter(model => model.brand_id === value);
                setSelectAllModels(
                  allModelsForBrand.length > 0 && 
                  brandModels.length === allModelsForBrand.length
                );
              }}
            >
              <SelectTrigger className="w-[200px]">
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
          </div>

          {selectedBrandForModels ? (
            <>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск моделей..."
                  className="pl-8"
                  value={searchModelTerm}
                  onChange={(e) => setSearchModelTerm(e.target.value)}
                />
              </div>
            
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="select-all-models" 
                  checked={selectAllModels}
                  onCheckedChange={handleToggleSelectAllModels}
                />
                <label 
                  htmlFor="select-all-models" 
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Выбрать все модели
                </label>
              </div>

              <ScrollArea className="h-[250px] border rounded-md p-3">
                <div className="grid grid-cols-2 gap-2">
                  {filteredCarModels.length === 0 ? (
                    <div className="col-span-2 text-center py-4 text-sm text-muted-foreground">
                      {searchModelTerm ? 
                        `Не найдено моделей по запросу "${searchModelTerm}"` : 
                        'Нет доступных моделей для этой марки'
                      }
                    </div>
                  ) : (
                    filteredCarModels.map((model) => (
                      <div key={model.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`model-${model.id}`}
                          checked={(selectedCarModels[selectedBrandForModels] || []).includes(model.id)}
                          onCheckedChange={() => handleToggleCarModel(model.id, selectedBrandForModels)}
                        />
                        <Label
                          htmlFor={`model-${model.id}`}
                          className="text-sm leading-none cursor-pointer"
                        >
                          {model.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="border rounded-md p-4 text-center">
              {selectedCarBrands.length === 0 ? (
                <div>
                  <Car className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                  <p>Сначала выберите хотя бы одну марку автомобиля во вкладке "Марки"</p>
                </div>
              ) : (
                <div>
                  <Car className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                  <p>Выберите марку для отображения доступных моделей</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    const totalSelectedBrands = selectedCarBrands.length;
    let totalSelectedModels = 0;
    
    Object.values(selectedCarModels).forEach(models => {
      totalSelectedModels += models.length;
    });
    
    return (
      <div className="flex items-center gap-2 my-4">
        <Badge className="bg-optapp-yellow text-optapp-dark">
          Выбрано марок: {totalSelectedBrands}
        </Badge>
        <Badge className="bg-optapp-yellow text-optapp-dark">
          Выбрано моделей: {totalSelectedModels}
        </Badge>
      </div>
    );
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
          <div className="space-y-4">
            <Tabs 
              defaultValue="brands" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="brands">Марки автомобилей</TabsTrigger>
                <TabsTrigger value="models">Модели автомобилей</TabsTrigger>
              </TabsList>
              <TabsContent value="brands" className="mt-4">
                {renderBrandsList()}
              </TabsContent>
              <TabsContent value="models" className="mt-4">
                {renderModelsList()}
              </TabsContent>
            </Tabs>
            
            {renderSummary()}
            
            <Button 
              className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500" 
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
