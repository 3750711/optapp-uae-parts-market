import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StoreInfoStepProps {
  onNext: (storeData: StoreData) => void;
  onBack: () => void;
  translations: any;
  optId?: string;
}

export interface StoreData {
  name: string;
  description: string;
  location: string;
}

export const StoreInfoStep: React.FC<StoreInfoStepProps> = ({
  onNext,
  onBack,
  translations,
  optId
}) => {
  const [formData, setFormData] = useState<StoreData>({
    name: '',
    description: '',
    location: ''
  });
  const [errors, setErrors] = useState<Partial<StoreData>>({});

  const locations = [
    { value: 'dubai', label: translations.locations.dubai },
    { value: 'abudhabi', label: translations.locations.abudhabi },
    { value: 'sharjah', label: translations.locations.sharjah },
    { value: 'ajman', label: translations.locations.ajman },
    { value: 'fujairah', label: translations.locations.fujairah },
    { value: 'ras_al_khaimah', label: translations.locations.ras_al_khaimah },
    { value: 'umm_al_quwain', label: translations.locations.umm_al_quwain }
  ];

  const validateForm = () => {
    const newErrors: Partial<StoreData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = translations.errors.nameRequired;
    }
    
    if (!formData.description.trim()) {
      newErrors.description = translations.errors.descriptionRequired;
    }
    
    if (!formData.location) {
      newErrors.location = translations.errors.locationRequired;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext(formData);
    }
  };

  const handleInputChange = (field: keyof StoreData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {translations.storeInformation}
        </h1>
      </div>

      {optId && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Ваш OPT_ID</p>
            <p className="text-2xl font-mono font-bold text-primary">{optId}</p>
            <p className="text-xs text-muted-foreground mt-1">Сохраните этот идентификатор</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">{translations.storeName}</Label>
              <Input
                id="storeName"
                type="text"
                placeholder={translations.storeNamePlaceholder}
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeDescription">{translations.storeDescription}</Label>
              <Textarea
                id="storeDescription"
                placeholder={translations.storeDescriptionPlaceholder}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={errors.description ? 'border-destructive' : ''}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeLocation">{translations.storeLocation}</Label>
              <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                <SelectTrigger className={errors.location ? 'border-destructive' : ''}>
                  <SelectValue placeholder={translations.selectLocation} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.value} value={location.value}>
                      {location.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location}</p>
              )}
            </div>

            <div className="flex space-x-4 pt-4">
              {optId ? (
                <Button type="submit" className="w-full">
                  {translations.next}
                </Button>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                    {translations.back}
                  </Button>
                  <Button type="submit" className="flex-1">
                    {translations.next}
                  </Button>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};