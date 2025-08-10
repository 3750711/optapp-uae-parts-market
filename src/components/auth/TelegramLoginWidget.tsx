import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AccountMergeDialog } from './AccountMergeDialog';
import { TelegramRegistrationModal } from './TelegramRegistrationModal';
import { useAuth } from '@/contexts/AuthContext';

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginWidgetProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  language?: 'ru' | 'en';
}

declare global {
  interface Window {
    TelegramLoginWidget: {
      dataOnauth: (user: TelegramAuthData) => void;
    };
  }
}

const getTelegramTranslations = (language: 'ru' | 'en') => {
  const translations = {
    ru: {
      title: "Профессиональная авторизация",
      description: "Безопасный вход через Telegram для участников B2B/B2C сообщества",
      instant: "Мгновенная авторизация без дополнительных паролей",
      recommended: "Рекомендованный способ входа",
      loading: "Авторизация через Telegram...",
      success: "Успешная авторизация через Telegram!",
      error: "Ошибка авторизации",
      mergeError: "Ошибка после объединения аккаунтов",
      mergeInfo: "Вы можете создать новый аккаунт через обычную регистрацию"
    },
    en: {
      title: "Professional Authorization",
      description: "Secure Telegram login for B2B/B2C community members",
      instant: "Instant authorization without additional passwords",
      recommended: "Recommended login method",
      loading: "Authorizing via Telegram...",
      success: "Successful Telegram authorization!",
      error: "Authorization error",
      mergeError: "Error after account merge",
      mergeInfo: "You can create a new account through regular registration"
    }
  };
  return translations[language];
};

export const TelegramLoginWidget: React.FC<TelegramLoginWidgetProps> = ({
  onSuccess,
  onError,
  language = 'ru'
}) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeData, setMergeData] = useState<{
    existingEmail: string;
    telegramData: TelegramAuthData;
  } | null>(null);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const { user, profile } = useAuth();

  // Generate deterministic password based on telegram_id
  const generateDeterministicPassword = async (telegramId: number): Promise<string> => {
    const salt = "telegram_partsbay_salt_2024"; // Static salt for consistency
    const data = telegramId.toString() + salt;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Convert to secure password with mixed characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    return Array.from(hashHex.slice(0, 32), (char, i) => 
      chars[hashHex.charCodeAt(i) % chars.length]
    ).join('');
  };

  const t = getTelegramTranslations(language);

  const handleTelegramAuth = async (authData: TelegramAuthData) => {
    try {
      toast.loading(t.loading);

      // Call the telegram-widget-auth Edge Function
      const { data, error } = await supabase.functions.invoke('telegram-widget-auth', {
        body: { authData }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Check if account merge is required
      if (data.requires_merge) {
        toast.dismiss();
        console.log('🔄 Account merge required for:', data.existing_email);
        setMergeData({
          existingEmail: data.existing_email,
          telegramData: data.telegram_data
        });
        setMergeDialogOpen(true);
        return;
      }

      console.log('🔍 Edge Function response:', data);

      // Check if profile completion is required
      if (data.requires_profile_completion) {
        toast.dismiss();
        console.log('🔄 Profile completion required, opening registration modal');
        // First log in the user, then show registration modal
        await handleDirectLogin(data.email, data.password, data.is_new_user, true);
        return;
      }

      // Handle normal login flow
      await handleDirectLogin(data.email, data.password, data.is_new_user);

    } catch (error) {
      toast.dismiss();
      const errorMessage = error instanceof Error ? error.message : t.error;
      toast.error(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleDirectLogin = async (email: string, password: string, isNewUser: boolean, requiresProfileCompletion = false) => {
    try {

      if (!isNewUser) {
        // Existing user: use signInWithPassword
        console.log('🔄 Using signInWithPassword for existing user:', email);
        
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (signInError) {
          console.error('signInWithPassword error:', signInError);
          throw signInError;
        }
      } else {
        // New user: use signInWithPassword with credentials from Edge Function
        console.log('🔄 Using signInWithPassword for new user:', email);
        
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (signInError) {
          console.error('signInWithPassword error for new user:', signInError);
          throw signInError;
        }
      }

      toast.dismiss();
      toast.success(t.success);
      
      if (requiresProfileCompletion) {
        // Show registration modal instead of navigating to separate page
        setRegistrationModalOpen(true);
      } else {
        onSuccess?.();
      }
    } catch (error) {
      toast.dismiss();
      const errorMessage = error instanceof Error ? error.message : t.error;
      toast.error(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleMergeSuccess = async (email: string, password: string) => {
    try {
      await handleDirectLogin(email, password, false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t.mergeError;
      toast.error(errorMessage);
      onError?.(errorMessage);
    }
  };

  // Auto-open modal for Telegram users with incomplete profiles
  useEffect(() => {
    if (user && profile && profile.auth_method === 'telegram' && (!profile.profile_completed || (profile as any).accepted_terms === false || (profile as any).accepted_privacy === false)) {
      console.log('🔄 Auto-opening registration modal for incomplete Telegram profile or missing terms/privacy acceptance');
      setRegistrationModalOpen(true);
    }
  }, [user, profile]);

  useEffect(() => {
    // Set up global callback
    window.TelegramLoginWidget = {
      dataOnauth: handleTelegramAuth
    };

    // Load Telegram widget script if not already loaded
    if (!scriptLoadedRef.current && widgetRef.current) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', 'Optnewads_bot'); // Configured bot username
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-onauth', 'TelegramLoginWidget.dataOnauth(user)');
      script.setAttribute('data-request-access', 'write');
      script.async = true;

      widgetRef.current.appendChild(script);
      scriptLoadedRef.current = true;
    }

    return () => {
      // Cleanup
      if (window.TelegramLoginWidget) {
        delete window.TelegramLoginWidget;
      }
    };
  }, []);

  return (
    <>
      <div className="flex flex-col items-center space-y-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t.description}
          </p>
        </div>
        <div 
          ref={widgetRef} 
          className="telegram-widget-container scale-110" 
          data-clarity-ignore="true"
          data-telegram-login="true"
        />
        <div className="text-center space-y-2">
        </div>
      </div>

      {mergeData && (
        <AccountMergeDialog
          open={mergeDialogOpen}
          onOpenChange={setMergeDialogOpen}
          existingEmail={mergeData.existingEmail}
          telegramData={mergeData.telegramData}
          onMergeSuccess={handleMergeSuccess}
          onCancel={() => {}}
          language={language}
        />
      )}

      <TelegramRegistrationModal
        open={registrationModalOpen}
        onOpenChange={setRegistrationModalOpen}
        language={language}
        onComplete={() => {
          setRegistrationModalOpen(false);
          onSuccess?.();
        }}
      />
    </>
  );
};
