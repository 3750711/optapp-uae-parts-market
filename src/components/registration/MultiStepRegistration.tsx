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
import EmailVerificationForm from '@/components/auth/EmailVerificationForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSubmissionGuard } from '@/hooks/useSubmissionGuard';
import { useNavigate } from 'react-router-dom';
import { checkOptIdExists } from '@/utils/authUtils';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { logRegistrationSuccess, logRegistrationFailure } from '@/utils/authLogger';

type RegistrationStep = 
  | 'type-selection'
  | 'telegram-auth'
  | 'account-type'
  | 'opt-id-generation'
  | 'store-info'
  | 'personal-info'
  | 'buyer-registration'
  | 'email-verification'
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
  
  const { guardedSubmit, isSubmitting } = useSubmissionGuard({
    timeout: 6000,
    onDuplicateSubmit: () => {
      // Already showing toast in useSubmissionGuard
    }
  });
  const [generatedOptId, setGeneratedOptId] = useState<string>('');
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { notifyAdminsNewUser } = useAdminNotifications();
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
        title: translations.errors.optIdGenerationTitle,
        description: error.message || translations.errors.optIdGenerationDescription,
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
  
  // Create seller account immediately after collecting personal info
  await guardedSubmit(async () => {
    await createSellerAccount(data);
  });
};

const handleBuyerRegistration = async (data: BuyerData) => {
  setBuyerData(data);
  
  // Create buyer account immediately after collecting data
  await guardedSubmit(async () => {
    await createBuyerAccount(data);
  });
};
// Remove this handler since we're not using email verification step for account creation anymore
// Email verification will be handled on the verify email page after account creation

const createSellerAccount = async (personalInfo: PersonalData) => {
    try {
      console.log('Creating seller account with data:', personalInfo);
      console.log('Generated OPT ID:', generatedOptId);
      
      // Validate that we have a generated OPT ID
      if (!generatedOptId || generatedOptId.trim() === '') {
        throw new Error('OPT ID not generated. Please try again.');
      }
      
      await logRegistrationSuccess('seller', 'email', 'pending-creation');
      
      // Step 1: Create auth user with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: personalInfo.email,
        password: personalInfo.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        await logRegistrationFailure('seller', 'email', authError.message);
        
        if (authError.message === 'User already registered') {
          toast({
            title: "Ошибка регистрации",
            description: "Пользователь с таким email уже существует. Попробуйте войти в систему.",
            variant: "destructive",
          });
          return;
        }
        
        throw authError;
      }

      if (!authData.user?.id) {
        const errorMsg = 'Failed to create user account';
        await logRegistrationFailure('seller', 'email', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('Auth user created:', authData.user.id);

      // Step 2: Complete profile setup using RPC (this will create the profile)
      console.log('Calling complete_profile_after_signup with opt_id:', generatedOptId);
      const { data: profileData, error: profileError } = await supabase.rpc('complete_profile_after_signup', {
        p_full_name: personalInfo.fullName,
        p_company_name: storeData?.name,
        p_location: storeData?.location,
        p_phone: personalInfo.phone,
        p_telegram: null, // No telegram field in PersonalData
        p_user_type: 'seller',
        p_opt_id: generatedOptId
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        await logRegistrationFailure('seller', 'email', profileError.message);
        throw profileError;
      }

      console.log('Profile created successfully:', profileData);
      
      await logRegistrationSuccess('seller', 'email', authData.user.id);

      toast({
        title: "Регистрация завершена!",
        description: "Ваш аккаунт продавца успешно создан. Пожалуйста, подтвердите ваш email.",
        variant: "default",
      });

      // Step 3: Redirect to email verification (email verification is optional for profile activation)
      navigate(`/verify-email?email=${encodeURIComponent(personalInfo.email)}&returnTo=/profile`);
    } catch (error: any) {
      console.error('Registration error:', error);
      await logRegistrationFailure('seller', 'email', error.message);
      
      toast({
        title: "Ошибка регистрации",
        description: error.message || "Произошла ошибка при регистрации. Попробуйте снова.",
        variant: "destructive",
      });
    }
  };

const createBuyerAccount = async (data: BuyerData) => {
    try {
      console.log('Creating buyer account with data:', data);
      console.log('Generated OPT ID:', generatedOptId);
      
      // Validate that we have a generated OPT ID
      if (!generatedOptId || generatedOptId.trim() === '') {
        throw new Error('OPT ID not generated. Please try again.');
      }
      
      await logRegistrationSuccess('buyer', 'email', 'pending-creation');
      
      // Step 1: Create auth user with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        await logRegistrationFailure('buyer', 'email', authError.message);
        
        if (authError.message === 'User already registered') {
          toast({
            title: "Ошибка регистрации",
            description: "Пользователь с таким email уже существует. Попробуйте войти в систему.",
            variant: "destructive",
          });
          return;
        }
        
        throw authError;
      }

      if (!authData.user?.id) {
        const errorMsg = 'Failed to create user account';
        await logRegistrationFailure('buyer', 'email', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('Auth user created:', authData.user.id);

      // Step 2: Complete profile setup using RPC
      console.log('Calling complete_profile_after_signup with opt_id:', generatedOptId);
      const { data: profileData, error: profileError } = await supabase.rpc('complete_profile_after_signup', {
        p_full_name: data.fullName,
        p_company_name: null,
        p_location: null,
        p_phone: data.phone,
        p_telegram: null,
        p_user_type: 'buyer',
        p_opt_id: generatedOptId
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        await logRegistrationFailure('buyer', 'email', profileError.message);
        throw profileError;
      }

      console.log('Profile created successfully:', profileData);
      
      await logRegistrationSuccess('buyer', 'email', authData.user.id);

      toast({
        title: "Регистрация завершена!",
        description: "Ваш аккаунт покупателя успешно создан. Пожалуйста, подтвердите ваш email.",
        variant: "default",
      });

      // Step 3: Redirect to email verification
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}&returnTo=/profile`);
    } catch (error: any) {
      console.error('Registration error:', error);
      await logRegistrationFailure('buyer', 'email', error.message);
      
      toast({
        title: "Ошибка регистрации",
        description: error.message || "Произошла ошибка при регистрации. Попробуйте снова.",
        variant: "destructive",
      });
    }
  };

  const handleTelegramSuccess = () => {
    toast({
      title: translations.auth.authorizationSuccessTitle,
      description: translations.auth.welcome,
    });
    navigate('/');
  };

  const handleTelegramError = (error: string) => {
    toast({
      title: translations.auth.authorizationErrorTitle,
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
    case 'email-verification':
      setCurrentStep(userType === 'seller' ? 'personal-info' : 'buyer-registration');
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
              language={language}
            />
          );

case 'buyer-registration':
  return (
    <BuyerRegistrationStep
      onNext={handleBuyerRegistration}
      onBack={goBack}
      translations={translations}
      optId={generatedOptId}
      language={language}
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