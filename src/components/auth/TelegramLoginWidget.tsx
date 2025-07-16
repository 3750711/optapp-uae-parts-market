import React, { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

declare global {
  interface Window {
    TelegramLoginWidget: {
      dataOnauth: (user: TelegramAuthData) => void;
    };
  }
}

export const TelegramLoginWidget: React.FC<TelegramLoginWidgetProps> = ({
  onSuccess,
  onError
}) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  const handleTelegramAuth = async (authData: TelegramAuthData) => {
    try {
      toast.loading('Авторизация через Telegram...');

      // Call the simplified telegram-auth Edge Function
      const { data, error } = await supabase.functions.invoke('telegram-auth', {
        body: authData
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Generate consistent password for Telegram users
      const generateTelegramPassword = (telegramId: number, email: string) => {
        return `telegram_${telegramId}_${email.split('@')[0]}`;
      };

      // Simplified logic: always use signUp for both new and existing users
      // Supabase Auth will handle existing users automatically
      const email = data.telegram_data.email;
      const password = generateTelegramPassword(data.telegram_data.id, email);

      console.log('🎯 Using simplified signUp flow for:', email);

      const { error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            auth_method: 'telegram',
            telegram_id: data.telegram_data.id.toString(),
            full_name: data.telegram_data.full_name,
            photo_url: data.telegram_data.photo_url,
            telegram: data.telegram_data.username,
            user_type: data.telegram_data.user_type || 'buyer'
          }
        }
      });

      if (signUpError) {
        // If it's a "User already registered" error, that's actually success
        // because Supabase will automatically sign in the existing user
        if (signUpError.message?.includes('User already registered')) {
          console.log('✅ User already exists - Supabase handled it automatically');
        } else {
          throw signUpError;
        }
      }

      toast.dismiss();
      toast.success('Успешная авторизация через Telegram!');
      onSuccess?.();
    } catch (error) {
      toast.dismiss();
      const errorMessage = error instanceof Error ? error.message : 'Ошибка авторизации';
      toast.error(errorMessage);
      onError?.(errorMessage);
    }
  };

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
    <div className="flex flex-col items-center space-y-4">
      <div ref={widgetRef} className="telegram-widget-container" />
      <p className="text-sm text-muted-foreground text-center">
        Войдите через Telegram для быстрого доступа
      </p>
    </div>
  );
};