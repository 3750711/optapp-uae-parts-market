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
import { checkOptIdExists } from '@/utils/authUtils';

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

  // Generate unique 4-letter OPT_ID for sellers
  const generateUniqueOptId = async (): Promise<string> => {
    let optId;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      // Generate 4 random uppercase letters
      optId = '';
      for (let i = 0; i < 4; i++) {
        optId += String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
      attempts++;
      
      if (attempts >= maxAttempts) {
        throw new Error('Не удалось сгенерировать уникальный OPT_ID');
      }
    } while (await checkOptIdExists(optId));
    
    return optId;
  };

  const handleRegistrationType = (type: RegistrationType) => {
    setRegistrationType(type);
    if (type === 'telegram') {
      setCurrentStep('telegram-auth');
    } else {
      setCurrentStep('account-type');
    }
  };

  const handleAccountType = async (type: UserType) => {
    setUserType(type);
    try {
      // Generate unique OPT ID for both buyers and sellers
      const optId = await generateUniqueOptId();
      setGeneratedOptId(optId);
      setCurrentStep('opt-id-generation');
    } catch (error: any) {
      toast({
        title: "Ошибка генерации OPT_ID",
        description: error.message || "Не удалось создать уникальный идентификатор",
        variant: "destructive",
      });
    }
  };

  const handleOptIdComplete = () => {
    if (userType === 'seller') {
      setCurrentStep('store-info');
    } else {
      setCurrentStep('buyer-registration');
    }
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
            user_type: 'buyer',
            verification_status: 'pending',
            auth_method: 'email'
          });

        if (profileError) throw profileError;

        toast({
          title: "Регистрация завершена",
          description: "Ваш аккаунт создан и ожидает верификации",
        });

        // Redirect to pending approval page
        setTimeout(() => {
          navigate('/pending-approval');
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
        setCurrentStep('opt-id-generation');
        break;
      case 'opt-id-generation':
        setCurrentStep('account-type');
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
              onBack={() => {}} // Disabled - cannot go back to OPT_ID generation
              translations={translations}
              optId={generatedOptId}
            />
          );

        case 'personal-info':
          return (
            <PersonalInfoStep
              onNext={handlePersonalInfo}
              onBack={goBack}
              translations={translations}
              optId={generatedOptId}
            />
          );

      case 'buyer-registration':
        return (
          <BuyerRegistrationStep
            onNext={handleBuyerRegistration}
            onBack={goBack}
            translations={translations}
            optId={generatedOptId}
          />
        );

      case 'final-loading':
        return <LoadingAnimation translations={translations} />;

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-card/90 backdrop-blur-sm rounded-2xl shadow-card-elegant border border-border/20 p-8">
        {renderStep()}
      </div>
    </div>
  );
};