import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BuyerRegistrationStepProps {
  onNext: (buyerData: BuyerData) => void;
  onBack: () => void;
  translations: any;
  optId?: string;
}

export interface BuyerData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export const BuyerRegistrationStep: React.FC<BuyerRegistrationStepProps> = ({
  onNext,
  onBack,
  translations,
  optId
}) => {
  const [formData, setFormData] = useState<BuyerData>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Partial<BuyerData>>({});

  const validateForm = () => {
    const newErrors: Partial<BuyerData> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = translations.errors.fullNameRequired;
    }
    
    if (!formData.email.trim()) {
      newErrors.email = translations.errors.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = translations.errors.emailInvalid;
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = translations.errors.phoneRequired;
    }
    
    if (!formData.password) {
      newErrors.password = translations.errors.passwordRequired;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = translations.errors.passwordMismatch;
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

  const handleInputChange = (field: keyof BuyerData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {translations.buyerRegistration}
        </h1>
      </div>

      {optId && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">{translations.yourOptId}</p>
            <p className="text-2xl font-mono font-bold text-primary">{optId}</p>
            <p className="text-xs text-muted-foreground mt-1">{translations.saveThisId}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{translations.fullName}</Label>
              <Input
                id="fullName"
                type="text"
                placeholder={translations.fullNamePlaceholder}
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className={errors.fullName ? 'border-destructive' : ''}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{translations.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder={translations.emailPlaceholder}
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{translations.phone}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder={translations.phonePlaceholder}
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{translations.password}</Label>
              <Input
                id="password"
                type="password"
                placeholder={translations.passwordPlaceholder}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{translations.confirmPassword}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={translations.confirmPasswordPlaceholder}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={errors.confirmPassword ? 'border-destructive' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="flex space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                {translations.back}
              </Button>
              <Button type="submit" className="flex-1">
                {translations.finish}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};