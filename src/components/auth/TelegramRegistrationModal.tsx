import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, User, Store, Phone, Building2 } from 'lucide-react';
import { registrationTranslations } from '@/translations/registration';

interface TelegramRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language?: 'ru' | 'en';
  onComplete?: () => void;
}

type UserType = 'buyer' | 'seller';
type RegistrationStep = 'account-type' | 'basic-info' | 'seller-info' | 'creating';

interface BasicInfo {
  fullName: string;
  phone: string;
}

interface SellerInfo {
  companyName: string;
  location: string;
  description: string;
}

export const TelegramRegistrationModal: React.FC<TelegramRegistrationModalProps> = ({
  open,
  onOpenChange,
  language = 'ru',
  onComplete
}) => {
  const { toast } = useToast();
  const { refreshProfile } = useAuth();
  const t = registrationTranslations[language];
  
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('account-type');
  const [userType, setUserType] = useState<UserType | null>(null);
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({ fullName: '', phone: '' });
  const [sellerInfo, setSellerInfo] = useState<SellerInfo>({ companyName: '', location: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const locations = [
    { value: 'dubai', label: t.locations.dubai },
    { value: 'abudhabi', label: t.locations.abudhabi },
    { value: 'sharjah', label: t.locations.sharjah },
    { value: 'ajman', label: t.locations.ajman },
    { value: 'fujairah', label: t.locations.fujairah },
    { value: 'ras_al_khaimah', label: t.locations.ras_al_khaimah },
    { value: 'umm_al_quwain', label: t.locations.umm_al_quwain },
  ];

  const generateOptId = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const validateBasicInfo = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!basicInfo.fullName.trim()) {
      newErrors.fullName = t.errors.fullNameRequired;
    }
    
    if (!basicInfo.phone.trim()) {
      newErrors.phone = t.errors.phoneRequired;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSellerInfo = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!sellerInfo.companyName.trim()) {
      newErrors.companyName = t.errors.nameRequired;
    }
    
    if (!sellerInfo.location) {
      newErrors.location = t.errors.locationRequired;
    }
    
    if (!sellerInfo.description.trim()) {
      newErrors.description = t.errors.descriptionRequired;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAccountTypeSelect = (type: UserType) => {
    setUserType(type);
    setCurrentStep('basic-info');
  };

  const handleBasicInfoNext = () => {
    if (!validateBasicInfo()) return;
    
    if (userType === 'seller') {
      setCurrentStep('seller-info');
    } else {
      handleComplete();
    }
  };

  const handleSellerInfoNext = () => {
    if (!validateSellerInfo()) return;
    handleComplete();
  };

  const handleComplete = async () => {
    if (!userType) return;
    
    setCurrentStep('creating');
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Generate OPT_ID for sellers only
      const optId = userType === 'seller' ? generateOptId() : null;

      // Prepare profile data
      const profileData = {
        full_name: basicInfo.fullName.trim(),
        phone: basicInfo.phone.trim(),
        user_type: userType,
        opt_id: optId,
        profile_completed: true,
        verification_status: 'pending',
        ...(userType === 'seller' && {
          company_name: sellerInfo.companyName.trim(),
          location: sellerInfo.location,
          description: sellerInfo.description.trim()
        })
      };

      console.log('Creating profile with data:', profileData);

      // Update the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      // Refresh profile to get latest data
      await refreshProfile();

      toast({
        title: "Регистрация завершена!",
        description: userType === 'seller' 
          ? `Ваш OPT_ID: ${optId}. Ожидайте верификации аккаунта.`
          : "Добро пожаловать на PartsBay!"
      });

      onComplete?.();
      onOpenChange(false);

    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Ошибка регистрации",
        description: error instanceof Error ? error.message : "Попробуйте еще раз",
        variant: "destructive"
      });
      setCurrentStep('account-type');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'basic-info':
        setCurrentStep('account-type');
        break;
      case 'seller-info':
        setCurrentStep('basic-info');
        break;
      default:
        break;
    }
  };

  const renderAccountTypeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">{t.chooseAccountType}</h3>
      </div>
      
      <div className="grid gap-4">
        <Card 
          className="cursor-pointer hover:bg-accent transition-colors border-2 hover:border-primary"
          onClick={() => handleAccountTypeSelect('buyer')}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <User className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <h4 className="font-semibold">{t.buyerAccount}</h4>
                <p className="text-sm text-muted-foreground">{t.buyerDescription}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-accent transition-colors border-2 hover:border-primary"
          onClick={() => handleAccountTypeSelect('seller')}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Store className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <h4 className="font-semibold">{t.sellerAccount}</h4>
                <p className="text-sm text-muted-foreground">{t.sellerDescription}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">{t.personalInformation}</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">{t.fullName}</label>
          <Input
            value={basicInfo.fullName}
            onChange={(e) => setBasicInfo({ ...basicInfo, fullName: e.target.value })}
            placeholder={t.fullNamePlaceholder}
            className={errors.fullName ? 'border-destructive' : ''}
          />
          {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <label className="text-sm font-medium">{t.phone}</label>
          <Input
            value={basicInfo.phone}
            onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
            placeholder={t.phonePlaceholder}
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleBack} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.back}
        </Button>
        <Button onClick={handleBasicInfoNext} className="flex-1">
          {userType === 'buyer' ? t.finish : t.next}
        </Button>
      </div>
    </div>
  );

  const renderSellerInfoStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">{t.storeInformation}</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">{t.storeName}</label>
          <Input
            value={sellerInfo.companyName}
            onChange={(e) => setSellerInfo({ ...sellerInfo, companyName: e.target.value })}
            placeholder={t.storeNamePlaceholder}
            className={errors.companyName ? 'border-destructive' : ''}
          />
          {errors.companyName && <p className="text-xs text-destructive mt-1">{errors.companyName}</p>}
        </div>

        <div>
          <label className="text-sm font-medium">{t.storeLocation}</label>
          <Select value={sellerInfo.location} onValueChange={(value) => setSellerInfo({ ...sellerInfo, location: value })}>
            <SelectTrigger className={errors.location ? 'border-destructive' : ''}>
              <SelectValue placeholder={t.selectLocation} />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.value} value={location.value}>
                  {location.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.location && <p className="text-xs text-destructive mt-1">{errors.location}</p>}
        </div>

        <div>
          <label className="text-sm font-medium">{t.storeDescription}</label>
          <Textarea
            value={sellerInfo.description}
            onChange={(e) => setSellerInfo({ ...sellerInfo, description: e.target.value })}
            placeholder={t.storeDescriptionPlaceholder}
            className={errors.description ? 'border-destructive' : ''}
            rows={3}
          />
          {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleBack} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.back}
        </Button>
        <Button onClick={handleSellerInfoNext} className="flex-1">
          {t.finish}
        </Button>
      </div>
    </div>
  );

  const renderCreatingStep = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <h3 className="text-lg font-semibold">{t.creatingAccount}</h3>
        <p className="text-muted-foreground">{t.waitingVerification}</p>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'account-type':
        return renderAccountTypeStep();
      case 'basic-info':
        return renderBasicInfoStep();
      case 'seller-info':
        return renderSellerInfoStep();
      case 'creating':
        return renderCreatingStep();
      default:
        return renderAccountTypeStep();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Завершение регистрации</DialogTitle>
        </DialogHeader>
        
        {renderCurrentStep()}
      </DialogContent>
    </Dialog>
  );
};