
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, Store, Car, Tag } from 'lucide-react';
import { StoreWithDetails } from '@/hooks/useAdminStores';
import { useCarBrandsAndModels } from '@/hooks/useCarBrandsAndModels';
import { StoreTag } from '@/types/store';

interface StoreEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: StoreWithDetails | null;
  onSave: (data: {
    store: Partial<StoreWithDetails>,
    selectedCarBrands: string[],
    selectedCarModels: {[brandId: string]: string[]}
  }) => void;
  isSaving: boolean;
}

const StoreEditDialog: React.FC<StoreEditDialogProps> = ({
  open,
  onOpenChange,
  store,
  onSave,
  isSaving
}) => {
  const [editedStore, setEditedStore] = useState<Partial<StoreWithDetails>>({});
  const [selectedCarBrands, setSelectedCarBrands] = useState<string[]>([]);
  const [selectedCarModels, setSelectedCarModels] = useState<{[brandId: string]: string[]}>({});
  const [selectedBrandForModels, setSelectedBrandForModels] = useState<string | null>(null);

  const { 
    brands: allCarBrands,
    brandModels: allCarModels,
    selectBrand,
    isLoading: isBrandsLoading
  } = useCarBrandsAndModels();

  useEffect(() => {
    if (store) {
      setEditedStore({
        id: store.id,
        name: store.name,
        description: store.description,
        address: store.address,
        location: store.location,
        phone: store.phone,
        owner_name: store.owner_name,
        tags: store.tags || [],
        verified: store.verified,
        telegram: store.telegram
      });

      const storeBrands = store.car_brands?.map(brand => brand.id) || [];
      setSelectedCarBrands(storeBrands);
      
      const modelsByBrand: {[brandId: string]: string[]} = {};
      store.car_models?.forEach(model => {
        if (!modelsByBrand[model.brand_id]) {
          modelsByBrand[model.brand_id] = [];
        }
        modelsByBrand[model.brand_id].push(model.id);
      });
      setSelectedCarModels(modelsByBrand);
    }
  }, [store]);

  const handleChange = (key: keyof StoreWithDetails, value: any) => {
    setEditedStore(prev => ({ ...prev, [key]: value }));
  };

  const handleToggleTag = (tag: StoreTag) => {
    const currentTags = editedStore.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    
    handleChange('tags', newTags);
  };

  const handleToggleCarBrand = (brandId: string) => {
    setSelectedCarBrands(prev => {
      if (prev.includes(brandId)) {
        setSelectedCarModels(prevModels => {
          const newModels = { ...prevModels };
          delete newModels[brandId];
          return newModels;
        });
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

  const handleSave = () => {
    if (!editedStore.id) return;
    onSave({
      store: editedStore,
      selectedCarBrands,
      selectedCarModels
    });
  };

  const availableTags: { value: StoreTag; label: string }[] = [
    { value: 'electronics', label: 'Электроника' },
    { value: 'auto_parts', label: 'Автозапчасти' },
    { value: 'accessories', label: 'Аксессуары' },
    { value: 'spare_parts', label: 'Запчасти' },
    { value: 'other', label: 'Другое' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Редактировать магазин
          </DialogTitle>
          <DialogDescription>
            Внесите изменения в информацию о магазине.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Основное
            </TabsTrigger>
            <TabsTrigger value="cars" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Автомобили
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Настройки
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 overflow-y-auto max-h-[400px]">
            <TabsContent value="basic" className="space-y-4 mt-0">
              <div className="space-y-2">
                <label className="text-sm font-medium">Название магазина</label>
                <Input
                  value={editedStore.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Описание</label>
                <Textarea
                  value={editedStore.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Адрес</label>
                  <Input
                    value={editedStore.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Город</label>
                  <Input
                    value={editedStore.location || ''}
                    onChange={(e) => handleChange('location', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Телефон</label>
                  <Input
                    value={editedStore.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Имя владельца</label>
                  <Input
                    value={editedStore.owner_name || ''}
                    onChange={(e) => handleChange('owner_name', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Телеграм</label>
                <Input
                  value={editedStore.telegram || ''}
                  onChange={(e) => handleChange('telegram', e.target.value)}
                  placeholder="username или https://t.me/username"
                />
              </div>
            </TabsContent>

            <TabsContent value="cars" className="space-y-4 mt-0">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Марки автомобилей
                  </h3>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {allCarBrands.map((brand) => (
                      <div key={brand.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`brand-${brand.id}`}
                          checked={selectedCarBrands.includes(brand.id)}
                          onCheckedChange={() => handleToggleCarBrand(brand.id)}
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
                </div>

                {selectedCarBrands.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-medium">Модели автомобилей</h3>
                      <Select 
                        value={selectedBrandForModels || ''} 
                        onValueChange={(value) => {
                          setSelectedBrandForModels(value);
                          selectBrand(value);
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
                    </div>
                    
                    {selectedBrandForModels && (
                      <div className="border rounded-lg p-3">
                        {isBrandsLoading ? (
                          <div className="text-center py-2">Загрузка моделей...</div>
                        ) : allCarModels.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                            {allCarModels.map((model) => (
                              <div key={model.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`model-${model.id}`}
                                  checked={(selectedCarModels[selectedBrandForModels] || []).includes(model.id)}
                                  onCheckedChange={() => handleToggleCarModel(model.id, selectedBrandForModels)}
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
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-0">
              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Теги
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <div key={tag.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag.value}`}
                          checked={(editedStore.tags || []).includes(tag.value)}
                          onCheckedChange={() => handleToggleTag(tag.value)}
                        />
                        <label
                          htmlFor={`tag-${tag.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {tag.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-4 border rounded-lg">
                  <Checkbox
                    id="verified"
                    checked={editedStore.verified}
                    onCheckedChange={(checked) => handleChange('verified', !!checked)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="verified"
                      className="text-sm font-medium leading-none flex items-center gap-1"
                    >
                      <Shield className="h-4 w-4" />
                      Проверенный магазин
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Проверенные магазины отображаются с отметкой проверки
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StoreEditDialog;
