
import React, { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import TouchOptimizedInput from '@/components/ui/TouchOptimizedInput';
import SmartFieldHints from '@/components/ui/SmartFieldHints';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OrderFormData } from '@/hooks/useOrderForm';
import { useCarBrandsAndModels } from '@/hooks/useCarBrandsAndModels';

interface BasicInfoStepProps {
  formData: OrderFormData;
  touchedFields: Set<string>;
  onInputChange: (field: string, value: string) => void;
  isFieldValid: (field: string) => boolean;
  getFieldError: (field: string) => string | null;
  isMobile?: boolean;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  formData,
  touchedFields,
  onInputChange,
  isFieldValid,
  getFieldError,
  isMobile = false
}) => {
  const [searchBrandTerm, setSearchBrandTerm] = useState("");
  const [searchModelTerm, setSearchModelTerm] = useState("");

  const {
    brands,
    allModels,
    isLoading,
    findBrandNameById,
    findModelNameById
  } = useCarBrandsAndModels();

  // Filter brands based on search term
  const filteredBrands = useMemo(() => {
    if (!searchBrandTerm) return brands;
    return brands.filter(brand => 
      brand.name.toLowerCase().includes(searchBrandTerm.toLowerCase())
    );
  }, [brands, searchBrandTerm]);

  // Get models for current brand and filter by search term
  const filteredModels = useMemo(() => {
    if (!formData.brandId || !allModels) return [];
    
    const brandModels = allModels.filter(model => model.brand_id === formData.brandId);
    
    if (!searchModelTerm) return brandModels;
    return brandModels.filter(model => 
      model.name.toLowerCase().includes(searchModelTerm.toLowerCase())
    );
  }, [allModels, formData.brandId, searchModelTerm]);

  // Handle brand change
  const handleBrandChange = (brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    if (brand) {
      onInputChange('brandId', brandId);
      onInputChange('brand', brand.name);
      // Reset model when brand changes
      onInputChange('modelId', '');
      onInputChange('model', '');
    }
  };

  // Handle model change
  const handleModelChange = (modelId: string) => {
    const model = filteredModels.find(m => m.id === modelId);
    if (model) {
      onInputChange('modelId', modelId);
      onInputChange('model', model.name);
    }
  };

  const getSmartHints = (fieldName: string, value: string) => {
    const hints = [];
    
    if (fieldName === 'title' && value.length > 0 && value.length < 10) {
      hints.push({
        type: 'tip' as const,
        text: 'Добавьте больше деталей в название для лучшего поиска'
      });
    }
    
    return hints;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className={isMobile ? "text-base font-medium" : ""}>
          Наименование *
        </Label>
        <TouchOptimizedInput 
          id="title" 
          value={formData.title}
          onChange={(e) => onInputChange('title', e.target.value)}
          required 
          placeholder="Введите наименование"
          touched={touchedFields.has('title')}
          error={getFieldError('title')}
          success={touchedFields.has('title') && isFieldValid('title')}
        />
        <SmartFieldHints 
          fieldName="title"
          value={formData.title}
          suggestions={getSmartHints('title', formData.title)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="brand" className={isMobile ? "text-base font-medium" : ""}>
            Бренд
          </Label>
          <Select
            value={formData.brandId}
            onValueChange={handleBrandChange}
            disabled={isLoading}
          >
            <SelectTrigger className={isMobile ? "h-12 text-base" : ""}>
              <SelectValue placeholder="Выберите бренд" />
            </SelectTrigger>
            <SelectContent 
              className="bg-white border border-gray-200 shadow-md max-h-60"
            >
              {filteredBrands.map((brand) => (
                <SelectItem 
                  key={brand.id} 
                  value={brand.id}
                  className={isMobile ? "py-3 text-base" : ""}
                >
                  {brand.name}
                </SelectItem>
              ))}
              {filteredBrands.length === 0 && (
                <div className="py-2 px-3 text-sm text-gray-500">
                  Бренд не найден
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="model" className={isMobile ? "text-base font-medium" : ""}>
            Модель
          </Label>
          <Select
            value={formData.modelId}
            onValueChange={handleModelChange}
            disabled={isLoading || !formData.brandId}
          >
            <SelectTrigger className={isMobile ? "h-12 text-base" : ""}>
              <SelectValue placeholder={formData.brandId ? "Выберите модель" : "Сначала выберите бренд"} />
            </SelectTrigger>
            <SelectContent 
              className="bg-white border border-gray-200 shadow-md max-h-60"
            >
              {filteredModels.map((model) => (
                <SelectItem 
                  key={model.id} 
                  value={model.id}
                  className={isMobile ? "py-3 text-base" : ""}
                >
                  {model.name}
                </SelectItem>
              ))}
              {filteredModels.length === 0 && formData.brandId && (
                <div className="py-2 px-3 text-sm text-gray-500">
                  Модель не найдена
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoStep;
