
import React, { useState, useMemo } from 'react';
import { useCarBrandsAndModels } from '@/hooks/useCarBrandsAndModels';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CreateRequest = () => {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const { 
    brands,
    allModels,
    isLoading: loadingBrands
  } = useCarBrandsAndModels();

  // Get models for currently selected brand
  const brandModels = useMemo(() => {
    if (!selectedBrandId || !allModels) return [];
    return allModels.filter(model => model.brand_id === selectedBrandId);
  }, [selectedBrandId, allModels]);

  const handleBrandSelect = (brandId: string) => {
    setSelectedBrandId(brandId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Submitting request:', { title, description, brandId: selectedBrandId });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Создать запрос</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Название запроса</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Что вы ищете?"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Марка автомобиля</label>
          <Select onValueChange={handleBrandSelect} disabled={loadingBrands}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите марку" />
            </SelectTrigger>
            <SelectContent>
              {brands.map(brand => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedBrandId && (
          <div>
            <label className="block text-sm font-medium mb-2">Модель автомобиля</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Выберите модель" />
              </SelectTrigger>
              <SelectContent>
                {brandModels.map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Описание</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Подробное описание того, что вы ищете"
            rows={4}
          />
        </div>

        <Button type="submit" className="w-full">
          Создать запрос
        </Button>
      </form>
    </div>
  );
};

export default CreateRequest;
