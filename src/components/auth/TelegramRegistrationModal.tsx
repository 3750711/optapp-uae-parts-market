import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { checkOptIdExists } from '@/utils/authUtils';
import { ArrowLeft, User, Store, Phone, Building2 } from 'lucide-react';
import { registrationTranslations } from '@/translations/registration';
import { Link } from 'react-router-dom';

interface TelegramRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language?: 'ru' | 'en' | 'bn';
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
  // Bengali users see English translations
  const actualLanguage = language === 'bn' ? 'en' : language;
  const t = registrationTranslations[actualLanguage as 'ru' | 'en'];
  
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('account-type');
  const [userType, setUserType] = useState<UserType | null>(null);
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({ fullName: '', phone: '' });
  const [sellerInfo, setSellerInfo] = useState<SellerInfo>({ companyName: '', location: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const locations = [
    { value: 'dubai', label: t.locations.dubai },
    { value: 'abudhabi', label: t.locations.abudhabi },
    { value: 'sharjah', label: t.locations.sharjah },
    { value: 'ajman', label: t.locations.ajman },
    { value: 'fujairah', label: t.locations.fujairah },
    { value: 'ras_al_khaimah', label: t.locations.ras_al_khaimah },
    { value: 'umm_al_quwain', label: t.locations.umm_al_quwain },
  ];

  const generateUniqueOptId = async (): Promise<string> => {
    try {
      // Simplified approach - generate random 4-letter ID
      // Add timestamp-based entropy to reduce collision probability
      const timestamp = Date.now().toString(36).slice(-2).toUpperCase();
      const randomChars = Math.random().toString(36).substring(2, 4).toUpperCase();
      let optId = timestamp + randomChars;
      
      // Ensure exactly 4 characters
      if (optId.length !== 4) {
        optId = '';
        for (let i = 0; i < 4; i++) {
          optId += String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
        }
      }
      
      console.log('Generated OPT_ID:', optId);
      return optId;
    } catch (error) {
      console.error('Error generating OPT_ID:', error);
      // Fallback: simple random generation
      let fallbackId = '';
      for (let i = 0; i < 4; i++) {
        fallbackId += String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
      return fallbackId;
    }
  };

  const validateBasicInfo = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!basicInfo.fullName.trim()) {
      newErrors.fullName = t.errors.fullNameRequired;
    }
    
    const phoneRaw = basicInfo.phone.trim();
    const phoneSanitized = phoneRaw.replace(/\s/g, '');
    if (!phoneRaw) {
      newErrors.phone = t.errors.phoneRequired;
    } else if (!/^\+?[1-9]\d{6,14}$/.test(phoneSanitized)) {
      newErrors.phone = actualLanguage === 'en' ? 'Enter a valid phone number' : 'Введите корректный номер телефона';
    }

    if (!acceptedTerms) {
      newErrors.acceptedTerms = actualLanguage === 'en' ? 'You must accept the Terms and Conditions' : 'Необходимо принять Условия использования';
    }
    if (!acceptedPrivacy) {
      newErrors.acceptedPrivacy = actualLanguage === 'en' ? 'You must accept the Privacy Policy' : 'Необходимо принять Политику конфиденциальности';
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
    console.log('Starting registration completion...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      console.log('User authenticated, generating OPT_ID...');
      
      // Generate OPT_ID with fallback mechanism
      let optId;
      try {
        optId = await generateUniqueOptId();
        console.log('OPT_ID generated via RPC:', optId);
      } catch (optError) {
        console.error('❌ OPT_ID generation via RPC failed, using fallback:', optError);
        // Simple fallback - generate based on current timestamp and user ID
        const timestamp = Date.now().toString();
        const userIdShort = user.id.replace(/-/g, '').substring(0, 8);
        optId = `TG${timestamp.slice(-6)}${userIdShort}`.toUpperCase();
        console.log('✅ Fallback OPT_ID generated:', optId);
      }

      if (!optId) {
        throw new Error('Failed to generate OPT_ID');
      }

      // Get existing Telegram data from user metadata
      const telegramData = user.user_metadata;
      console.log('Existing Telegram data:', telegramData);

      // Prepare profile data for atomic update
      const profileData = {
        full_name: basicInfo.fullName.trim(),
        phone: basicInfo.phone.trim(),
        user_type: userType,
        opt_id: optId,
        profile_completed: true,
        verification_status: 'pending' as const,
        accepted_terms: true,
        accepted_terms_at: new Date().toISOString(),
        accepted_privacy: true,
        accepted_privacy_at: new Date().toISOString(),
        // Better utilize existing Telegram data
        telegram: telegramData?.telegram || user.user_metadata?.telegram || '',
        telegram_id: telegramData?.telegram_id || user.user_metadata?.telegram_id || '',
        ...(userType === 'seller' && {
          company_name: sellerInfo.companyName.trim(),
          location: sellerInfo.location,
          description_user: sellerInfo.description.trim()
        })
      };

      console.log('Profile data to update:', {
        ...profileData,
        opt_id: `${optId.substring(0, 6)}...`,
        telegram_id: profileData.telegram_id ? `${profileData.telegram_id.toString().substring(0, 4)}...` : 'none'
      });

      // Update the profile with improved error handling
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (profileError) {
        console.error('❌ Database update error:', profileError);
        
        // Provide more specific error messages
        if (profileError.message?.includes('validate_profile_update')) {
          throw new Error('Validation failed - profile cannot be updated');
        } else if (profileError.message?.includes('duplicate')) {
          throw new Error('OPT_ID already exists');
        } else {
          throw profileError;
        }
      }

      console.log('✅ Profile updated successfully');

      // Admin notification is handled by DB trigger; no client-side invoke

      // Refresh profile to get latest data
      await refreshProfile();

      toast({
        title: actualLanguage === 'en' ? "Registration completed!" : "Регистрация завершена!",
        description: userType === 'seller' 
          ? (actualLanguage === 'en' 
              ? `Your OPT_ID: ${optId}. Awaiting account verification.`
              : `Ваш OPT_ID: ${optId}. Ожидайте верификации аккаунта.`)
          : (actualLanguage === 'en'
              ? `Your OPT_ID: ${optId}. Welcome to PartsBay!`
              : `Ваш OPT_ID: ${optId}. Добро пожаловать на PartsBay!`)
      });

      console.log('Registration completed successfully');
      onComplete?.();
      onOpenChange(false);

    } catch (error) {
      console.error('Registration completion error:', error);
      
      let errorMessage = "Попробуйте еще раз";
      if (actualLanguage === 'en') {
        errorMessage = "Please try again";
      }
      
      // More specific error messages
      if (error instanceof Error) {
        if (error.message.includes('No authenticated user')) {
          errorMessage = actualLanguage === 'en' 
            ? "Authentication error. Please try logging in again."
            : "Ошибка аутентификации. Попробуйте войти заново.";
        } else if (error.message.includes('profiles')) {
          errorMessage = actualLanguage === 'en'
            ? "Profile update failed. Please check your data."
            : "Не удалось обновить профиль. Проверьте данные.";
        }
      }
      
      toast({
        title: actualLanguage === 'en' ? "Registration Error" : "Ошибка регистрации",
        description: errorMessage,
        variant: "destructive"
      });
      setCurrentStep('basic-info');
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
            type="tel"
            inputMode="tel"
            value={basicInfo.phone}
            onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
            placeholder={t.phonePlaceholder}
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <input
              id="terms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground">
              {actualLanguage === 'en' ? (
                <>I accept the <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline">Terms and Conditions</Link></>
              ) : (
                <>Я принимаю <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline">Условия использования</Link></>
              )}
            </label>
          </div>
          {errors.acceptedTerms && (
            <p className="text-xs text-destructive">{errors.acceptedTerms}</p>
          )}

          <div className="flex items-start gap-2">
            <input
              id="privacy"
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="privacy" className="text-sm text-muted-foreground">
              {actualLanguage === 'en' ? (
                <>I accept the <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Privacy Policy</Link></>
              ) : (
                <>Я принимаю <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Политику конфиденциальности</Link></>
              )}
            </label>
          </div>
          {errors.acceptedPrivacy && (
            <p className="text-xs text-destructive">{errors.acceptedPrivacy}</p>
          )}
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
        <p className="text-sm text-muted-foreground">
          {actualLanguage === 'en' ? 'Generating your unique OPT_ID...' : 'Генерируем ваш уникальный OPT_ID...'}
        </p>
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

// Disable manual closing entirely during registration
// The modal will only be closed programmatically after successful completion.

return (
  <Dialog 
    open={open}
  >
    <DialogContent 
      className="sm:max-w-md" 
      onPointerDownOutside={(e) => e.preventDefault()}
      onEscapeKeyDown={(e) => e.preventDefault()}
      hideCloseButton
    >
        <DialogHeader>
          <DialogTitle>
            {actualLanguage === 'en' ? 'Complete Registration' : 'Завершение регистрации'}
          </DialogTitle>
        </DialogHeader>
        
        {renderCurrentStep()}
      </DialogContent>
    </Dialog>
  );
};
