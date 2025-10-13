
import React, { useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAllCarBrands } from '@/hooks/useAllCarBrands';
import type { CarBrand, CarModel } from '@/hooks/useLazyCarData';

interface SimpleCarSelectorProps {
  brandId: string;
  modelId: string;
  onBrandChange: (brandId: string, brandName: string) => void;
  onModelChange: (modelId: string, modelName: string) => void;
  isMobile?: boolean;
  disabled?: boolean;
  // Опциональные данные от родительского компонента через useLazyCarData
  // Если не переданы, будет использоваться useAllCarBrands
  brands?: CarBrand[];
  models?: CarModel[];
  isLoadingBrands?: boolean;
  isLoadingModels?: boolean;
  enableBrandsLoading?: () => void;
}

const SimpleCarSelector: React.FC<SimpleCarSelectorProps> = ({
  brandId,
  modelId,
  onBrandChange,
  onModelChange,
  isMobile = false,
  disabled = false,
  brands: externalBrands,
  models: externalModels,
  isLoadingBrands: externalLoadingBrands,
  isLoadingModels: externalLoadingModels,
  enableBrandsLoading: externalEnableBrandsLoading
}) => {
  // Локальные состояния для поиска
  const [brandSearchTerm, setBrandSearchTerm] = useState('');
  const [modelSearchTerm, setModelSearchTerm] = useState('');
  
  // Fallback к useAllCarBrands если внешние данные не переданы
  const {
    brands: internalBrands,
    allModels: internalAllModels,
    isLoading: internalLoading,
    findBrandNameById,
    findModelNameById
  } = useAllCarBrands();

  // Определяем какие данные использовать
  const brands = externalBrands || internalBrands;
  const isLoadingBrands = externalLoadingBrands ?? internalLoading;
  const isLoadingModels = externalLoadingModels ?? internalLoading;
  
  // Фильтрация моделей для внутреннего useAllCarBrands
  const filteredInternalModels = useMemo(() => {
    if (externalModels) return []; // используем внешние модели
    if (!brandId) return [];
    return internalAllModels.filter(model => model.brand_id === brandId);
  }, [internalAllModels, brandId, externalModels]);
  
  const models = externalModels || filteredInternalModels;

  // Фильтрация брендов по поисковому запросу
  const filteredBrands = useMemo(() => {
    if (!brandSearchTerm.trim()) return brands;
    
    const term = brandSearchTerm.toLowerCase();
    return brands.filter(brand => 
      brand.name.toLowerCase().includes(term)
    );
  }, [brands, brandSearchTerm]);

  // Фильтрация моделей по поисковому запросу
  const filteredModels = useMemo(() => {
    if (!modelSearchTerm.trim()) return models;
    
    const term = modelSearchTerm.toLowerCase();
    return models.filter(model => 
      model.name.toLowerCase().includes(term)
    );
  }, [models, modelSearchTerm]);

  // Обработчики изменения значений
  const handleBrandChange = (selectedBrandId: string) => {
    if (externalBrands) {
      // Используем внешние данные
      const brand = brands.find(b => b.id === selectedBrandId);
      if (brand) {
        onBrandChange(selectedBrandId, brand.name);
      }
    } else {
      // Используем внутренние данные (useAllCarBrands)
      const brandName = findBrandNameById(selectedBrandId);
      if (brandName) {
        onBrandChange(selectedBrandId, brandName);
        // Сбрасываем модель при смене бренда для внутреннего режима
        onModelChange('', '');
      }
    }
    // Сброс поиска после выбора
    setBrandSearchTerm('');
  };

  const handleModelChange = (selectedModelId: string) => {
    if (externalModels) {
      // Используем внешние данные
      const model = models.find(m => m.id === selectedModelId);
      if (model) {
        onModelChange(selectedModelId, model.name);
      }
    } else {
      // Используем внутренние данные (useAllCarBrands)
      const modelName = findModelNameById(selectedModelId);
      if (modelName) {
        onModelChange(selectedModelId, modelName);
      }
    }
    // Сброс поиска после выбора
    setModelSearchTerm('');
  };

  const handleBrandFocus = () => {
    if (externalEnableBrandsLoading) {
      externalEnableBrandsLoading();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="brand" className={isMobile ? "text-base font-medium" : ""}>
          Бренд
        </Label>
        {isLoadingBrands ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select
            value={brandId}
            onValueChange={handleBrandChange}
            onOpenChange={(open) => open && handleBrandFocus()}
            disabled={disabled}
          >
            <SelectTrigger className={isMobile ? "h-12 text-base" : ""}>
              <SelectValue placeholder="Выберите бренд" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-md max-h-60">
              {/* Поле поиска бренда */}
              <div className="p-2 border-b sticky top-0 bg-white z-10">
                <input
                  type="text"
                  placeholder="🔍 Поиск бренда..."
                  value={brandSearchTerm}
                  onChange={(e) => setBrandSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>

              {/* Отфильтрованный список брендов */}
              {filteredBrands.length > 0 ? (
                filteredBrands.map((brand) => (
                  <SelectItem 
                    key={brand.id} 
                    value={brand.id}
                    className={isMobile ? "py-3 text-base" : ""}
                  >
                    {brand.name}
                  </SelectItem>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Бренд не найден
                </div>
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="model" className={isMobile ? "text-base font-medium" : ""}>
          Модель
        </Label>
        <Select
          value={modelId}
          onValueChange={handleModelChange}
          disabled={disabled || !brandId}
        >
          <SelectTrigger className={isMobile ? "h-12 text-base" : ""}>
            <SelectValue placeholder={
              brandId 
                ? (isLoadingModels ? 'Загрузка моделей...' : 'Выберите модель')
                : 'Сначала выберите бренд'
            } />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-md max-h-60">
            {/* Поле поиска модели */}
            <div className="p-2 border-b sticky top-0 bg-white z-10">
              <input
                type="text"
                placeholder="🔍 Поиск модели..."
                value={modelSearchTerm}
                onChange={(e) => setModelSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>

            {/* Состояния загрузки/пустоты */}
            {isLoadingModels ? (
              <div className="p-2 space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : models.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Модели не найдены
              </div>
            ) : filteredModels.length > 0 ? (
              filteredModels.map((model) => (
                <SelectItem 
                  key={model.id} 
                  value={model.id}
                  className={isMobile ? "py-3 text-base" : ""}
                >
                  {model.name}
                </SelectItem>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm">
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
