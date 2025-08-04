import React, { useState, useEffect } from 'react';
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
  const [telegramData, setTelegramData] = useState<any>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Check for Telegram registration on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isTelegramRegistration = urlParams.get('telegram') === 'true';
    
    if (isTelegramRegistration) {
      // Get Telegram data from sessionStorage
      const storedTelegramData = sessionStorage.getItem('telegram_registration_data');
      if (storedTelegramData) {
        const parsedData = JSON.parse(storedTelegramData);
        setTelegramData(parsedData);
        setRegistrationType('telegram');
        setCurrentStep('account-type');
        console.log('Telegram registration initialized with data:', parsedData);
      }
    }
  }, []);
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
      let signUpError = null;
      
      if (registrationType === 'telegram' && telegramData) {
        // For Telegram users, update existing user instead of creating new
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Update user metadata
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              full_name: data.fullName,
              phone: data.phone,
              location: storeData?.location,
              user_type: 'seller',
              opt_id: generatedOptId,
              company_name: storeData?.name,
              telegram: telegramData.username || '',
              avatar_url: telegramData.photo_url || '',
              profile_completed: true,
              verification_status: 'pending',
              requires_full_registration: false
            }
          });

          if (updateError) {
            signUpError = updateError;
          } else {
            // Create profile for Telegram user
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: data.email,
                full_name: data.fullName,
                auth_method: 'telegram',
                telegram_id: telegramData.id,
                telegram: telegramData.username || '',
                avatar_url: telegramData.photo_url || '',
                phone: data.phone,
                location: storeData?.location,
                user_type: 'seller',
                opt_id: generatedOptId,
                company_name: storeData?.name,
                profile_completed: true,
                verification_status: 'pending'
              });

            if (profileError) {
              console.error('Profile creation error:', profileError);
            }

            // Create store
            if (storeData) {
              const { error: storeError } = await supabase
                .from('stores')
                .insert({
                  name: storeData.name,
                  description: storeData.description,
                  location: storeData.location,
                  address: storeData.location,
                  seller_id: user.id,
                  owner_name: data.fullName,
                  phone: data.phone
                });

              if (storeError) {
                console.error('Store creation error:', storeError);
              }
            }
          }
        }
      } else {
        // Standard email registration
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

        if (authError) {
          signUpError = authError;
        } else if (authData.user) {
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
        }
      }

      if (signUpError) {
        throw signUpError;
      }

      toast({
        title: "Регистрация завершена",
        description: "Ваш аккаунт создан и ожидает верификации",
      });

      // Clear sensitive data
      sessionStorage.removeItem('telegram_registration_data');

      // Redirect to pending approval page
      setTimeout(() => {
        navigate('/pending-approval');
      }, 2000);
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
      let signUpError = null;
      
      if (registrationType === 'telegram' && telegramData) {
        // For Telegram users, update existing user instead of creating new
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Update user metadata
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              full_name: data.fullName,
              phone: data.phone,
              user_type: 'buyer',
              opt_id: generatedOptId,
              telegram: telegramData.username || '',
              avatar_url: telegramData.photo_url || '',
              profile_completed: true,
              verification_status: 'pending',
              requires_full_registration: false
            }
          });

          if (updateError) {
            signUpError = updateError;
          } else {
            // Create profile for Telegram user
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: data.email,
                full_name: data.fullName,
                auth_method: 'telegram',
                telegram_id: telegramData.id,
                telegram: telegramData.username || '',
                avatar_url: telegramData.photo_url || '',
                phone: data.phone,
                user_type: 'buyer',
                opt_id: generatedOptId,
                profile_completed: true,
                verification_status: 'pending'
              });

            if (profileError) {
              console.error('Profile creation error:', profileError);
            }
          }
        }
      } else {
        // Standard email registration
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

        if (authError) {
          signUpError = authError;
        } else if (authData.user) {
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
        }
      }

      if (signUpError) {
        throw signUpError;
      }

      toast({
        title: "Регистрация завершена",
        description: "Ваш аккаунт создан и ожидает верификации",
      });

      // Clear sensitive data
      sessionStorage.removeItem('telegram_registration_data');

      // Redirect to pending approval page
      setTimeout(() => {
        navigate('/pending-approval');
      }, 2000);
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
        // Skip registration type step for Telegram users
        if (registrationType === 'telegram') {
          return null; // This step is skipped
        }
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