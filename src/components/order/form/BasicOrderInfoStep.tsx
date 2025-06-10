
import React from 'react';
import { Label } from '@/components/ui/label';
import TouchOptimizedInput from '@/components/ui/TouchOptimizedInput';
import SmartFieldHints from '@/components/ui/SmartFieldHints';
import SimpleCarSelector from '@/components/ui/SimpleCarSelector';
import { OrderFormData } from '@/hooks/useOrderForm';

interface BasicOrderInfoStepProps {
  formData: OrderFormData;
  touchedFields: Set<string>;
  onInputChange: (field: string, value: string) => void;
  isFieldValid: (field: string) => boolean;
  getFieldError: (field: string) => string | null;
  isMobile?: boolean;
}

const BasicOrderInfoStep: React.FC<BasicOrderInfoStepProps> = ({
  formData,
  touchedFields,
  onInputChange,
  isFieldValid,
  getFieldError,
  isMobile = false
}) => {
  // Обработчик изменения бренда
  const handleBrandChange = (brandId: string, brandName: string) => {
    onInputChange('brandId', brandId);
    onInputChange('brand', brandName);
    // Сбрасываем модель при смене бренда
    onInputChange('modelId', '');
    onInputChange('model', '');
  };

  // Обработчик изменения модели
  const handleModelChange = (modelId: string, modelName: string) => {
    onInputChange('modelId', modelId);
    onInputChange('model', modelName);
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

      <SimpleCarSelector
        brandId={formData.brandId}
        modelId={formData.modelId}
        onBrandChange={handleBrandChange}
        onModelChange={handleModelChange}
        isMobile={isMobile}
      />
    </div>
  );
};

export default BasicOrderInfoStep;
