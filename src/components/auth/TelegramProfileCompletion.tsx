import React, { useState } from 'react';
import { registrationTranslations } from '@/translations/registration';
import { AccountTypeStep } from '@/components/registration/AccountTypeStep';
import { StoreInfoStep, StoreData } from '@/components/registration/StoreInfoStep';
import { PersonalInfoStep, PersonalData } from '@/components/registration/PersonalInfoStep';
import { BuyerRegistrationStep, BuyerData } from '@/components/registration/BuyerRegistrationStep';
import { OptIdAnimation } from '@/components/animations/OptIdAnimation';
import { LoadingAnimation } from '@/components/animations/LoadingAnimation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { checkOptIdExists } from '@/utils/authUtils';

type CompletionStep = 
  | 'account-type'
  | 'opt-id-generation'
  | 'store-info'
  | 'personal-info'
  | 'buyer-registration'
  | 'final-loading';

type UserType = 'buyer' | 'seller';

interface TelegramProfileCompletionProps {
  language?: 'ru' | 'en';
}

export const TelegramProfileCompletion: React.FC<TelegramProfileCompletionProps> = ({ 
  language = 'ru' 
}) => {
  const [currentStep, setCurrentStep] = useState<CompletionStep>('account-type');
  const [userType, setUserType] = useState<UserType | null>(null);
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [personalData, setPersonalData] = useState<PersonalData | null>(null);
  const [buyerData, setBuyerData] = useState<BuyerData | null>(null);
  const [generatedOptId, setGeneratedOptId] = useState<string>('');
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const translations = registrationTranslations[language];

  // Generate unique 4-letter OPT_ID for sellers
  const generateUniqueOptId = async (): Promise<string> => {
    let optId;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      attempts++;
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      optId = Array.from({ length: 4 }, () => 
        characters.charAt(Math.floor(Math.random() * characters.length))
      ).join('');
      
      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique OPT_ID after maximum attempts');
      }
    } while (await checkOptIdExists(optId));
    
    return optId;
  };

  const handleAccountType = async (type: UserType) => {
    setUserType(type);
    
    if (type === 'seller') {
      setCurrentStep('opt-id-generation');
      
      try {
        const newOptId = await generateUniqueOptId();
        setGeneratedOptId(newOptId);
      } catch (error) {
        console.error('Error generating OPT_ID:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось сгенерировать OPT_ID",
          variant: "destructive",
        });
      }
    } else {
      setCurrentStep('buyer-registration');
    }
  };

  const handleOptIdComplete = () => {
    setCurrentStep('store-info');
  };

  const handleStoreInfo = (data: StoreData) => {
    setStoreData(data);
    setCurrentStep('personal-info');
  };

  const handlePersonalInfo = (data: PersonalData) => {
    setPersonalData(data);
    setCurrentStep('final-loading');
    createSellerAccount();
  };

  const handleBuyerRegistration = (data: BuyerData) => {
    setBuyerData(data);
    setCurrentStep('final-loading');
    createBuyerAccount();
  };

  const createSellerAccount = async () => {
    if (!storeData || !personalData || !userType || !user) {
      console.error('Missing required data for seller account creation');
      return;
    }

    try {
      // Update the existing user profile with seller data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          user_type: 'seller',
          full_name: personalData.fullName,
          phone: personalData.phone,
          opt_id: generatedOptId,
          company_name: storeData.name,
          description_user: storeData.description,
          location: storeData.location,
          profile_completed: true,
          verification_status: 'pending'
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating seller profile:', profileError);
        toast({
          title: "Ошибка",
          description: "Не удалось создать аккаунт продавца",
          variant: "destructive",
        });
        return;
      }

      // Refresh profile to get updated data
      await refreshProfile();

      toast({
        title: "Успех",
        description: "Аккаунт продавца успешно создан!",
      });

      // Navigate to seller dashboard
      navigate('/seller');
    } catch (error) {
      console.error('Error creating seller account:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать аккаунт",
        variant: "destructive",
      });
    }
  };

  const createBuyerAccount = async () => {
    if (!buyerData || !userType || !user) {
      console.error('Missing required data for buyer account creation');
      return;
    }

    try {
      // Update the existing user profile with buyer data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          user_type: 'buyer',
          full_name: buyerData.fullName,
          phone: buyerData.phone,
          profile_completed: true,
          verification_status: 'pending'
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating buyer profile:', profileError);
        toast({
          title: "Ошибка",
          description: "Не удалось создать аккаунт покупателя",
          variant: "destructive",
        });
        return;
      }

      // Refresh profile to get updated data
      await refreshProfile();

      toast({
        title: "Успех",
        description: "Аккаунт покупателя успешно создан!",
      });

      // Navigate to home page
      navigate('/');
    } catch (error) {
      console.error('Error creating buyer account:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать аккаунт",
        variant: "destructive",
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'account-type':
        return (
          <AccountTypeStep
            onSelectType={handleAccountType}
            onBack={() => {}} // No back button for Telegram completion
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
            onBack={() => setCurrentStep('account-type')}
            translations={translations}
            optId={generatedOptId}
          />
        );

      case 'personal-info':
        return (
          <PersonalInfoStep
            onNext={handlePersonalInfo}
            onBack={() => setCurrentStep('store-info')}
            translations={translations}
            optId={generatedOptId}
          />
        );

      case 'buyer-registration':
        return (
          <BuyerRegistrationStep
            onNext={handleBuyerRegistration}
            onBack={() => setCurrentStep('account-type')}
            translations={translations}
          />
        );

      case 'final-loading':
        return (
          <LoadingAnimation 
            translations={{
              creatingAccount: userType === 'seller' 
                ? translations.creatingAccount || 'Создаем аккаунт продавца...'
                : translations.creatingAccount || 'Создаем аккаунт покупателя...',
              waitingVerification: translations.waitingVerification || 'Ожидаем верификацию...',
              verificationNote: translations.verificationNote || 'Ваш аккаунт будет проверен в ближайшее время.'
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Завершите профиль
          </h1>
          <p className="text-muted-foreground">
            Расскажите нам больше о себе для завершения регистрации
          </p>
        </div>
        
        {renderStep()}
      </div>
    </div>
  );
};