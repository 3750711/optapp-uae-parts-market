import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, User, ArrowLeft, ShoppingCart } from 'lucide-react';

interface TelegramBuyerRegistrationStepProps {
  onComplete: (data: { fullName: string; phone: string }) => void;
  onBack: () => void;
  translations: any;
  initialName?: string;
}

export const TelegramBuyerRegistrationStep: React.FC<TelegramBuyerRegistrationStepProps> = ({
  onComplete,
  onBack,
  translations,
  initialName = ""
}) => {
  const [fullName, setFullName] = React.useState(initialName);
  const [phone, setPhone] = React.useState('');
  const [errors, setErrors] = React.useState<{ fullName?: string; phone?: string }>({});

  const validateForm = () => {
    const newErrors: { fullName?: string; phone?: string } = {};
    
    if (!fullName.trim()) {
      newErrors.fullName = translations.buyerRegistration.fullNameRequired;
    }
    
    if (!phone.trim()) {
      newErrors.phone = translations.buyerRegistration.phoneRequired;
    } else if (!/^\+?[\d\s-()]+$/.test(phone)) {
      newErrors.phone = translations.buyerRegistration.phoneInvalid;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onComplete({ fullName: fullName.trim(), phone: phone.trim() });
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {translations.buyerRegistration.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {translations.buyerRegistration.description}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <User className="inline h-4 w-4 mr-1" />
                {translations.buyerRegistration.fullName}
              </label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={translations.buyerRegistration.fullNamePlaceholder}
                className={errors.fullName ? "border-red-500" : ""}
              />
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Phone className="inline h-4 w-4 mr-1" />
                {translations.buyerRegistration.phone}
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={translations.buyerRegistration.phonePlaceholder}
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {translations.common.back}
              </Button>
              <Button
                type="submit"
                className="flex-1"
              >
                {translations.buyerRegistration.createAccount}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};