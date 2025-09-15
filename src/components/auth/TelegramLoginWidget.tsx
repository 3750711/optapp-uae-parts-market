import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRateLimit } from '@/hooks/useRateLimit';
import { AccountMergeDialog } from './AccountMergeDialog';
import { TelegramRegistrationModal } from './TelegramRegistrationModal';
import { useAuth } from '@/contexts/AuthContext';
import { logLoginFailure, logLoginSuccess, logRateLimitHit } from '@/utils/authLogger';

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
  language?: 'ru' | 'en' | 'bn';
  compact?: boolean;
}

declare global {
  interface Window {
    TelegramLoginWidget: {
      dataOnauth: (user: TelegramAuthData) => void;
    };
  }
}

const getTelegramTranslations = (language: 'ru' | 'en' | 'bn') => {
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
    },
    bn: {
      title: "পেশাদার অথরাইজেশন",
      description: "B2B/B2C কমিউনিটি সদস্যদের জন্য নিরাপদ টেলিগ্রাম লগইন",
      instant: "অতিরিক্ত পাসওয়ার্ড ছাড়াই তাৎক্ষণিক অথরাইজেশন",
      recommended: "প্রস্তাবিত লগইন পদ্ধতি",
      loading: "টেলিগ্রামের মাধ্যমে অথরাইজেশন...",
      success: "সফল টেলিগ্রাম অথরাইজেশন!",
      error: "অথরাইজেশন ত্রুটি",
      mergeError: "অ্যাকাউন্ট একীকরণের পরে ত্রুটি",
      mergeInfo: "আপনি নিয়মিত রেজিস্ট্রেশনের মাধ্যমে একটি নতুন অ্যাকাউন্ট তৈরি করতে পারেন"
    }
  };
  // Bengali users see English translations for Telegram login
  const actualLanguage = language === 'bn' ? 'en' : language;
  return translations[actualLanguage as 'ru' | 'en'];
};

export const TelegramLoginWidget: React.FC<TelegramLoginWidgetProps> = ({
  onSuccess,
  onError,
  language = 'ru',
  compact = false
}) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeData, setMergeData] = useState<{
    existingEmail: string;
    telegramData: TelegramAuthData;
  } | null>(null);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const { user, profile, signInWithTelegram, signIn, status } = useAuth();
  const { checkRateLimit } = useRateLimit();
  const [ready, setReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

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
  const isCompact = !!compact;
  const widgetSize = isCompact ? 'medium' : 'large';

  const handleTelegramAuth = async (authData: TelegramAuthData) => {
    try {
      // Rate limiting check
      const allowed = await checkRateLimit('login', { limitPerHour: 10, windowMinutes: 60 });
      if (!allowed) {
        await logRateLimitHit('telegram', { telegramId: authData.id });
        return;
      }

      toast.loading(t.loading);

      console.log('🚀 [TelegramWidget] Using AuthContext.signInWithTelegram');
      
      // Use AuthContext from the top level
      const result = await signInWithTelegram(authData);

      if (result.error) {
        throw result.error;
      }

      const data = result.telegramData;
      if (!data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      // If Telegram is already linked to the current account, just notify and exit
      if (data.already_linked) {
        toast.dismiss();
        toast.success(t.success);
        onSuccess?.();
        return;
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

      console.log('🔍 Telegram auth response:', data);

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
      await logLoginFailure('telegram', errorMessage);
      toast.error(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleDirectLogin = async (email: string, password: string, isNewUser: boolean, requiresProfileCompletion = false) => {
    try {
      console.log('🔄 [TelegramWidget] Using AuthContext.signIn for:', email, 'isNew:', isNewUser);
      
      // Use AuthContext from the top level
      const { user: resultUser, error: signInError } = await signIn(email, password);

      if (signInError) {
        console.error('❌ [TelegramWidget] AuthContext.signIn error:', signInError);
        throw signInError;
      }

      if (resultUser) {
        console.log('✅ [TelegramWidget] AuthContext.signIn success for user:', resultUser.id);
        await logLoginSuccess('telegram', resultUser.id);
        
        // Add profile loading retry mechanism
        const waitForProfile = () => new Promise<void>((resolve) => {
          const maxRetries = 10;
          let retries = 0;
          
          const checkProfile = () => {
            retries++;
            if (profile && profile.id === resultUser.id) {
              console.log('✅ [TelegramWidget] Profile loaded successfully');
              resolve();
            } else if (retries >= maxRetries) {
              console.warn('⚠️ [TelegramWidget] Profile loading timeout, continuing anyway');
              resolve();
            } else {
              setTimeout(checkProfile, 200); // Check every 200ms
            }
          };
          
          checkProfile();
        });
        
        // Wait for profile to load before proceeding
        await waitForProfile();
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
      console.log('🔄 [TelegramWidget] Handling merge success for:', email);
      await handleDirectLogin(email, password, false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t.mergeError;
      console.error('❌ [TelegramWidget] Merge success error:', error);
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
    // Don't render widget if already authenticated
    if (status !== 'guest') return;
    
    console.log('🔍 TelegramLoginWidget: Setting up widget', {
      widgetRefExists: !!widgetRef.current,
      scriptLoaded: scriptLoadedRef.current,
      widgetSize,
      timestamp: new Date().toISOString()
    });

    // Set up global callback
    window.TelegramLoginWidget = {
      dataOnauth: handleTelegramAuth
    };

    // Add watchdog timer for slow loading
    const watchdogTimeout = setTimeout(() => {
      if (!ready && widgetRef.current) {
        console.warn('⚠️ TelegramLoginWidget: Script loading timeout after 8s');
        setTimedOut(true);
      }
    }, 8000);

    // Load Telegram widget script if not already loaded
    if (!scriptLoadedRef.current && widgetRef.current) {
      console.log('🔍 TelegramLoginWidget: Creating and loading script');
      
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', 'Optnewads_bot');
      script.setAttribute('data-size', widgetSize);
      script.setAttribute('data-onauth', 'TelegramLoginWidget.dataOnauth(user)');
      script.setAttribute('data-request-access', 'write');
      script.async = true;

      script.onload = () => {
        console.log('✅ TelegramLoginWidget: Script loaded successfully');
        setReady(true);
      };
      
      script.onerror = (error) => {
        console.error('❌ TelegramLoginWidget: Script loading failed', error);
        setTimedOut(true);
      };

      widgetRef.current.appendChild(script);
      scriptLoadedRef.current = true;
    }

    return () => {
      clearTimeout(watchdogTimeout);
      if (window.TelegramLoginWidget) {
        delete window.TelegramLoginWidget;
      }
    };
  }, [status]);

  // Don't render widget if already authenticated
  if (status !== 'guest') return null;

  return (
    <>
      <div className={`flex flex-col items-center ${isCompact ? 'space-y-4' : 'space-y-6'}`}>
        {!isCompact && (
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.description}
            </p>
          </div>
        )}
        
        {/* Loading skeleton while script loads */}
        {!ready && !timedOut && (
          <div className="h-12 w-48 bg-muted animate-pulse rounded-md" />
        )}
        
        <div 
          ref={widgetRef} 
          className={isCompact ? 'telegram-widget-container' : 'telegram-widget-container scale-110'} 
          data-clarity-ignore="true"
          data-telegram-login="true"
        />
        
        {/* Fallback for slow/blocked Telegram */}
        {timedOut && !ready && (
          <div className="mt-3 text-sm text-amber-600 text-center">
            Telegram медленно загружается. Попробуйте{' '}
            <a 
              href="https://t.me/Optnewads_bot" 
              target="_blank" 
              rel="noreferrer"
              className="underline hover:no-underline"
            >
              открыть бота
            </a>{' '}
            в отдельной вкладке.
          </div>
        )}
        
        <div className="text-center space-y-2"></div>
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
