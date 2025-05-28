
import React from 'react';
import { Label } from '@/components/ui/label';
import TouchOptimizedInput from '@/components/ui/TouchOptimizedInput';
import SmartFieldHints from '@/components/ui/SmartFieldHints';
import { OrderFormData } from '@/hooks/useOrderForm';

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
          <Label htmlFor="brand" className={isMobile ? "text-base font-medium" : ""}>Бренд</Label>
          <TouchOptimizedInput 
            id="brand" 
            value={formData.brand}
            onChange={(e) => onInputChange('brand', e.target.value)}
            placeholder="Введите бренд"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model" className={isMobile ? "text-base font-medium" : ""}>Модель</Label>
          <TouchOptimizedInput 
            id="model"
            value={formData.model}
            onChange={(e) => onInputChange('model', e.target.value)}
            placeholder="Введите модель"
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfoStep;
