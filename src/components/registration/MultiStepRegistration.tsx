import React, { useState } from 'react';
import { registrationTranslations } from '@/translations/registration';
import { RegistrationTypeStep } from './RegistrationTypeStep';
import { AccountTypeStep } from './AccountTypeStep';
import { StoreInfoStep, StoreData } from './StoreInfoStep';
import { PersonalInfoStep, PersonalData } from './PersonalInfoStep';
import { BuyerRegistrationStep, BuyerData } from './BuyerRegistrationStep';
import { OptIdAnimation } from '@/components/animations/OptIdAnimation';
import { LoadingAnimation } from '@/components/animations/LoadingAnimation';
import { TelegramLoginWidget } from '@/components/auth/TelegramLoginWidget';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

type RegistrationStep = 
  | 'type-selection'
  | 'telegram-auth'
  | 'account-type'
  | 'opt-id-generation'
  | 'store-info'
  | 'personal-info'
  | 'buyer-registration'
  | 'final-loading';

type UserType = 'buyer' | 'seller';
type RegistrationType = 'telegram' | 'standard';

interface MultiStepRegistrationProps {
  language?: 'ru' | 'en';
}

export const MultiStepRegistration: React.FC<MultiStepRegistrationProps> = ({ 
  language = 'ru' 
}) => {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('type-selection');
  const [registrationType, setRegistrationType] = useState<RegistrationType | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [personalData, setPersonalData] = useState<PersonalData | null>(null);
  const [buyerData, setBuyerData] = useState<BuyerData | null>(null);
  const [generatedOptId, setGeneratedOptId] = useState<string>('');
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const translations = registrationTranslations[language];

  // Generate OPT_ID for sellers
  const generateOptId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `OPT${timestamp}${randomSuffix}`;
  };

  const handleRegistrationType = (type: RegistrationType) => {
    setRegistrationType(type);
    if (type === 'telegram') {
      setCurrentStep('telegram-auth');
    } else {
      setCurrentStep('account-type');
    }
  };

  const handleAccountType = (type: UserType) => {
    setUserType(type);
    if (type === 'buyer') {
      setCurrentStep('buyer-registration');
    } else {
      // Generate OPT ID for sellers
      const optId = generateOptId();
      setGeneratedOptId(optId);
      setCurrentStep('opt-id-generation');
    }
  };

  const handleOptIdComplete = () => {
    setCurrentStep('store-info');
  };

  const handleStoreInfo = (data: StoreData) => {
    setStoreData(data);
    setCurrentStep('personal-info');
  };

  const handlePersonalInfo = async (data: PersonalData) => {
    setPersonalData(data);
    setCurrentStep('final-loading');
    await createSellerAccount(data);
  };

  const handleBuyerRegistration = async (data: BuyerData) => {
    setBuyerData(data);
    setCurrentStep('final-loading');
    await createBuyerAccount(data);
  };

  const createSellerAccount = async (data: PersonalData) => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: data.fullName,
            user_type: 'seller',
            opt_id: generatedOptId,
            phone: data.phone
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: data.email,
            full_name: data.fullName,
            phone: data.phone,
            opt_id: generatedOptId,
            user_type: 'seller',
            verification_status: 'pending',
            auth_method: 'email',
            company_name: storeData?.name
          });

        if (profileError) throw profileError;

        // Create store
        if (storeData) {
          const { error: storeError } = await supabase
            .from('stores')
            .insert({
              name: storeData.name,
              description: storeData.description,
              location: storeData.location,
              address: storeData.location,
              seller_id: authData.user.id,
              owner_name: data.fullName,
              phone: data.phone
            });

          if (storeError) throw storeError;
        }

        toast({
          title: "Регистрация завершена",
          description: "Ваш аккаунт создан и ожидает верификации",
        });

        // Redirect to login page
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Ошибка регистрации",
        description: error.message || "Произошла ошибка при создании аккаунта",
        variant: "destructive",
      });
      setCurrentStep('personal-info');
    }
  };

  const createBuyerAccount = async (data: BuyerData) => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: data.fullName,
            user_type: 'buyer',
            phone: data.phone
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: data.email,
            full_name: data.fullName,
            phone: data.phone,
            user_type: 'buyer',
            auth_method: 'email'
          });

        if (profileError) throw profileError;

        toast({
          title: "Регистрация завершена",
          description: "Добро пожаловать в PartsBay!",
        });

        // Redirect to login page
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Ошибка регистрации",
        description: error.message || "Произошла ошибка при создании аккаунта",
        variant: "destructive",
      });
      setCurrentStep('buyer-registration');
    }
  };

  const handleTelegramSuccess = () => {
    toast({
      title: "Успешная авторизация",
      description: "Добро пожаловать!",
    });
    navigate('/');
  };

  const handleTelegramError = (error: string) => {
    toast({
      title: "Ошибка авторизации",
      description: error,
      variant: "destructive",
    });
  };

  const goBack = () => {
    switch (currentStep) {
      case 'telegram-auth':
      case 'account-type':
        setCurrentStep('type-selection');
        break;
      case 'buyer-registration':
        setCurrentStep('account-type');
        break;
      case 'store-info':
        setCurrentStep('opt-id-generation');
        break;
      case 'personal-info':
        setCurrentStep('store-info');
        break;
      default:
        break;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'type-selection':
        return (
          <RegistrationTypeStep
            onSelectType={handleRegistrationType}
            translations={translations}
          />
        );

      case 'telegram-auth':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">
                {translations.telegramRegistration}
              </h1>
            </div>
            <TelegramLoginWidget
              onSuccess={handleTelegramSuccess}
              onError={handleTelegramError}
              language={language}
            />
            <div className="text-center">
              <button
                onClick={goBack}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                {translations.back}
              </button>
            </div>
          </div>
        );

      case 'account-type':
        return (
          <AccountTypeStep
            onSelectType={handleAccountType}
            onBack={goBack}
            translations={translations}
          />
        );

      case 'opt-id-generation':
        return (
          <OptIdAnimation
            optId={generatedOptId}
            onComplete={handleOptIdComplete}
            translations={translations}
          />
        );

      case 'store-info':
        return (
          <StoreInfoStep
            onNext={handleStoreInfo}
            onBack={goBack}
            translations={translations}
          />
        );

      case 'personal-info':
        return (
          <PersonalInfoStep
            onNext={handlePersonalInfo}
            onBack={goBack}
            translations={translations}
          />
        );

      case 'buyer-registration':
        return (
          <BuyerRegistrationStep
            onNext={handleBuyerRegistration}
            onBack={goBack}
            translations={translations}
          />
        );

      case 'final-loading':
        return <LoadingAnimation translations={translations} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {renderStep()}
      </div>
    </div>
  );
};