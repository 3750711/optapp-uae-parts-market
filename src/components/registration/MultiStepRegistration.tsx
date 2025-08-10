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
import { useNavigate } from 'react-router-dom';
import { checkOptIdExists } from '@/utils/authUtils';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';

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
  setCurrentStep('email-verification');
};

const handleBuyerRegistration = async (data: BuyerData) => {
  setBuyerData(data);
  setCurrentStep('email-verification');
};
const handleEmailVerificationSuccess = async (verifiedEmail: string) => {
  // After successful email verification, proceed with account creation
  setCurrentStep('final-loading');
  try {
    if (userType === 'seller' && personalData) {
      await createSellerAccount(personalData);
    } else if (userType === 'buyer' && buyerData) {
      await createBuyerAccount(buyerData);
    } else {
      toast({
        title: translations.errors.registrationErrorTitle,
        description: translations.errors.registrationErrorDescription,
        variant: 'destructive',
      });
      // Fallback to start
      setCurrentStep('type-selection');
    }
  } catch (e) {
    // Errors are handled inside create* functions
  }
};

const createSellerAccount = async (data: PersonalData) => {
    try {
      const metadata = {
        full_name: data.fullName,
        user_type: 'seller',
        opt_id: generatedOptId,
        phone: data.phone,
        company_name: storeData?.name ?? null,
        location: storeData?.location ?? null,
        description_user: storeData?.description ?? null,
        accepted_terms: true,
        accepted_terms_at: new Date().toISOString(),
        accepted_privacy: true,
        accepted_privacy_at: new Date().toISOString(),
        registration_path: 'standard'
      } as const;

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: metadata,
        },
      });

      if (authError) throw authError;

      // If no session yet (email confirmation required), guide user to login after confirming
      if (!authData.session) {
        toast({
          title: language === 'en' ? 'Confirm your email' : 'Подтвердите почту',
          description:
            language === 'en'
              ? 'We sent a confirmation link. Please confirm and log in to continue.'
              : 'Мы отправили ссылку подтверждения. Подтвердите email и войдите, чтобы продолжить.',
        });
        navigate(
          `/login?notice=check-email&email=${encodeURIComponent(data.email)}&returnTo=/pending-approval`,
          { replace: true }
        );
        return;
      }

      // If session exists (email auto-confirm), complete profile immediately
      await supabase.rpc('complete_profile_after_signup', {
        p_email: data.email,
        payload: metadata,
      });

      // Notify admins about new user (deduped on server)
      const newUserId = authData.user?.id || (await supabase.auth.getUser()).data.user?.id;
      if (newUserId) {
        notifyAdminsNewUser({
          userId: newUserId,
          fullName: metadata.full_name,
          email: data.email,
          userType: metadata.user_type,
          phone: metadata.phone,
          optId: metadata.opt_id,
          telegram: null,
          createdAt: new Date().toISOString(),
        });
      }

      toast({
        title: translations.success.registrationCompletedTitle,
        description: translations.success.accountCreatedPending,
      });

      navigate('/pending-approval', { replace: true });
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: translations.errors.registrationErrorTitle,
        description: error.message || translations.errors.registrationErrorDescription,
        variant: 'destructive',
      });
      setCurrentStep('personal-info');
    }
  };

const createBuyerAccount = async (data: BuyerData) => {
    try {
      const metadata = {
        full_name: data.fullName,
        user_type: 'buyer',
        opt_id: generatedOptId,
        phone: data.phone,
        accepted_terms: true,
        accepted_terms_at: new Date().toISOString(),
        accepted_privacy: true,
        accepted_privacy_at: new Date().toISOString(),
        registration_path: 'standard'
      } as const;

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: metadata,
        },
      });

      if (authError) throw authError;

      // If no session yet (email confirmation required), guide user to login after confirming
      if (!authData.session) {
        toast({
          title: language === 'en' ? 'Confirm your email' : 'Подтвердите почту',
          description:
            language === 'en'
              ? 'We sent a confirmation link. Please confirm and log in to continue.'
              : 'Мы отправили ссылку подтверждения. Подтвердите email и войдите, чтобы продолжить.',
        });
        navigate(
          `/login?notice=check-email&email=${encodeURIComponent(data.email)}&returnTo=/pending-approval`,
          { replace: true }
        );
        return;
      }

      // If session exists (email auto-confirm), complete profile immediately
      await supabase.rpc('complete_profile_after_signup', {
        p_email: data.email,
        payload: metadata,
      });

      // Notify admins about new user (deduped on server)
      const newUserId = authData.user?.id || (await supabase.auth.getUser()).data.user?.id;
      if (newUserId) {
        notifyAdminsNewUser({
          userId: newUserId,
          fullName: metadata.full_name,
          email: data.email,
          userType: metadata.user_type,
          phone: metadata.phone,
          optId: metadata.opt_id,
          telegram: null,
          createdAt: new Date().toISOString(),
        });
      }

      toast({
        title: translations.success.registrationCompletedTitle,
        description: translations.success.accountCreatedPending,
      });

      navigate('/pending-approval', { replace: true });
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: translations.errors.registrationErrorTitle,
        description: error.message || translations.errors.registrationErrorDescription,
        variant: 'destructive',
      });
      setCurrentStep('buyer-registration');
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

case 'email-verification':
  return (
    <EmailVerificationForm
      initialEmail={(userType === 'seller' ? personalData?.email : buyerData?.email) || ''}
      onVerificationSuccess={handleEmailVerificationSuccess}
      onCancel={() => setCurrentStep(userType === 'seller' ? 'personal-info' : 'buyer-registration')}
      title={language === 'en' ? 'Verify your email' : 'Подтвердите email'}
      description={language === 'en' ? 'Введите 6-значный код из письма' : 'Введите 6-значный код, отправленный на вашу почту'}
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