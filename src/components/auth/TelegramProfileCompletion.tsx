import React, { useState } from 'react';
import { registrationTranslations } from '@/translations/registration';
import { AccountTypeStep } from '@/components/registration/AccountTypeStep';
import { StoreInfoStep, StoreData } from '@/components/registration/StoreInfoStep';
import { TelegramPersonalInfoStep } from '@/components/registration/TelegramPersonalInfoStep';
import { TelegramBuyerRegistrationStep } from '@/components/registration/TelegramBuyerRegistrationStep';
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
  // Always start with account type selection for Telegram users
  const [currentStep, setCurrentStep] = useState<CompletionStep>('account-type');
  const [userType, setUserType] = useState<UserType | null>(null);
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [personalData, setPersonalData] = useState<{ fullName: string; phone: string } | null>(null);
  const [buyerData, setBuyerData] = useState<{ fullName: string; phone: string } | null>(null);
  const [generatedOptId, setGeneratedOptId] = useState<string>('');
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const translations = registrationTranslations[language];

  // Calculate progress
  const getProgress = () => {
    const steps = ['account-type', 'opt-id-generation', userType === 'seller' ? 'store-info' : 'buyer-registration'];
    if (userType === 'seller') steps.push('personal-info');
    const currentIndex = steps.indexOf(currentStep);
    return Math.max(0, (currentIndex + 1) / steps.length * 100);
  };

  const getStepLabel = () => {
    switch (currentStep) {
      case 'account-type': return 'Шаг 1: Тип аккаунта';
      case 'opt-id-generation': return 'Шаг 2: Генерация OPT_ID';
      case 'store-info': return 'Шаг 3: Информация о магазине';
      case 'buyer-registration': return 'Шаг 3: Данные покупателя';
      case 'personal-info': return 'Шаг 4: Личные данные';
      case 'final-loading': return 'Завершение...';
      default: return '';
    }
  };


  // Generate unique 4-letter OPT_ID
  const generateUniqueOptId = async (): Promise<string> => {
    console.log('Starting OPT ID generation...');
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let optId = '';
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      // Generate new 4-character OPT ID
      optId = Array.from({ length: 4 }, () => 
        characters.charAt(Math.floor(Math.random() * characters.length))
      ).join('');
      
      console.log(`Attempt ${attempts}: Generated OPT ID: ${optId}`);
      
      try {
        const exists = await checkOptIdExists(optId);
        console.log(`OPT ID ${optId} exists: ${exists}`);
        
        if (!exists) {
          console.log(`Successfully generated unique OPT ID: ${optId}`);
          return optId;
        }
      } catch (error) {
        console.error(`Error checking OPT ID ${optId}:`, error);
        // Continue trying with next ID
      }
    }
    
    console.error('Failed to generate unique OPT_ID after maximum attempts');
    throw new Error('Не удалось сгенерировать уникальный OPT_ID. Попробуйте еще раз.');
  };

  const handleAccountType = async (type: UserType) => {
    console.log('Selected user type:', type);
    setUserType(type);
    
    // Show loading immediately
    setCurrentStep('opt-id-generation');
    
    try {
      // Generate unique OPT ID for BOTH buyers and sellers (unified flow)
      console.log('Starting OPT ID generation for user type:', type);
      const newOptId = await generateUniqueOptId();
      
      if (!newOptId || newOptId.length !== 4) {
        throw new Error('Invalid OPT ID generated');
      }
      
      console.log('Successfully generated OPT ID:', newOptId);
      setGeneratedOptId(newOptId);
      
      // Auto-progress after a short delay to show the animation
      setTimeout(() => {
        handleOptIdComplete();
      }, 2000);
      
    } catch (error) {
      console.error('Error generating OPT_ID:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось сгенерировать OPT_ID. Попробуйте еще раз.",
        variant: "destructive",
      });
      
      // Return to account type selection
      setCurrentStep('account-type');
      setUserType(null);
      setGeneratedOptId('');
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

  const handlePersonalInfo = (data: { fullName: string; phone: string }) => {
    setPersonalData(data);
    setCurrentStep('final-loading');
    createSellerAccount();
  };

  const handleBuyerRegistration = (data: { fullName: string; phone: string }) => {
    setBuyerData(data);
    setCurrentStep('final-loading');
    createBuyerAccount();
  };

  // Get initial name from user data
  const getInitialName = () => {
    if (profile?.full_name) return profile.full_name;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.user_metadata?.name) return user.user_metadata.name;
    return '';
  };

  const createSellerAccount = async () => {
    if (!storeData || !personalData || !userType || !user) {
      console.error('Missing required data for seller account creation');
      return;
    }

    if (!generatedOptId || generatedOptId.length !== 4) {
      console.error('Missing or invalid generatedOptId:', generatedOptId);
      toast({
        title: "Ошибка",
        description: "OPT ID не был сгенерирован. Попробуйте еще раз.",
        variant: "destructive",
      });
      setCurrentStep('account-type');
      return;
    }

    try {
      console.log('Creating seller account with data:', {
        opt_id: generatedOptId,
        user_type: 'seller',
        company_name: storeData.name,
        full_name: personalData.fullName,
        phone: personalData.phone,
        verification_status: 'pending',
        profile_completed: true
      });

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

      console.log('Seller account created successfully with OPT ID:', generatedOptId);
      
      // Refresh profile to get updated data
      await refreshProfile();

      toast({
        title: "Успех",
        description: "Аккаунт продавца успешно создан!",
      });

      // Navigate to pending approval for moderation
      navigate('/pending-approval');
    } catch (error) {
      console.error('Error creating seller account:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать аккаунт. Попробуйте еще раз.",
        variant: "destructive",
      });
      
      // Go back to personal info step to try again
      setCurrentStep('personal-info');
    }
  };

  const createBuyerAccount = async () => {
    if (!buyerData || !userType || !user) {
      console.error('Missing required data for buyer account creation');
      return;
    }

    if (!generatedOptId || generatedOptId.length !== 4) {
      console.error('Missing or invalid generatedOptId:', generatedOptId);
      toast({
        title: "Ошибка",
        description: "OPT ID не был сгенерирован. Попробуйте еще раз.",
        variant: "destructive",
      });
      setCurrentStep('account-type');
      return;
    }

    try {
      console.log('Creating buyer account with data:', {
        opt_id: generatedOptId,
        user_type: 'buyer',
        full_name: buyerData.fullName,
        phone: buyerData.phone,
        verification_status: 'pending',
        profile_completed: true
      });

      // Update the existing user profile with buyer data (including OPT_ID)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          user_type: 'buyer',
          full_name: buyerData.fullName,
          phone: buyerData.phone,
          opt_id: generatedOptId, // Add OPT_ID for buyers too
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

      console.log('Buyer account created successfully with OPT ID:', generatedOptId);

      // Refresh profile to get updated data
      await refreshProfile();

      toast({
        title: "Успех",
        description: "Аккаунт покупателя успешно создан!",
      });

      // Navigate to pending approval for moderation
      navigate('/pending-approval');
    } catch (error) {
      console.error('Error creating buyer account:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать аккаунт. Попробуйте еще раз.",
        variant: "destructive",
      });
      
      // Go back to buyer registration step to try again
      setCurrentStep('buyer-registration');
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
            onBack={() => setCurrentStep('opt-id-generation')}
            translations={translations}
            optId={generatedOptId}
          />
        );

      case 'personal-info':
        return (
          <TelegramPersonalInfoStep
            onComplete={handlePersonalInfo}
            onBack={() => setCurrentStep('store-info')}
            translations={translations}
            initialName={getInitialName()}
          />
        );

      case 'buyer-registration':
        return (
          <TelegramBuyerRegistrationStep
            onComplete={handleBuyerRegistration}
            onBack={() => setCurrentStep('opt-id-generation')}
            translations={translations}
            initialName={getInitialName()}
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
          
          {/* Progress indicator */}
          {currentStep !== 'final-loading' && (
            <div className="mt-6 mb-4">
              <div className="text-sm text-muted-foreground mb-2">{getStepLabel()}</div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out" 
                  style={{ width: `${getProgress()}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        
        {renderStep()}
      </div>
    </div>
  );
};