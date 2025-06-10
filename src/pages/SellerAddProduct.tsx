
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCarBrandsAndModels } from "@/hooks/useCarBrandsAndModels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SellerAddProduct = () => {
  const navigate = useNavigate();
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    placeNumber: '1'
  });
  
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
    console.log('Submitting product:', { ...formData, brandId: selectedBrandId });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Добавить товар</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Название товара</label>
          <Input
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Название товара"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Цена</label>
          <Input
            type="number"
            value={formData.price}
            onChange={(e) => handleInputChange('price', e.target.value)}
            placeholder="Цена в долларах"
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
          <label className="block text-sm font-medium mb-2">Количество мест</label>
          <Input
            type="number"
            value={formData.placeNumber}
            onChange={(e) => handleInputChange('placeNumber', e.target.value)}
            placeholder="1"
            min="1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Описание</label>
          <Textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Описание товара"
            rows={4}
          />
        </div>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Отмена
          </Button>
          <Button type="submit" className="flex-1">
            Добавить товар
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SellerAddProduct;
