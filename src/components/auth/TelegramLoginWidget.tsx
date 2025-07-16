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

      // Call the stable telegram-auth Edge Function
      const { data, error } = await supabase.functions.invoke('telegram-auth', {
        body: authData
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.is_existing_user) {
        // Existing Telegram user - use magic link via OTP
        const email = data.user_data.email;
        
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: email,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (otpError) {
          console.error('OTP sign in error:', otpError);
          throw new Error(`Ошибка входа: ${otpError.message}`);
        }

        toast.dismiss();
        toast.success('Магическая ссылка отправлена на ваш email!');
        toast.info('Проверьте почту для завершения входа.');
        onSuccess?.();
        return; // Exit early to prevent further execution
      } else {
        // New user - sign them up
        const email = `user.${data.telegram_data.id}@telegram.partsbay.ae`;
        const fullName = data.telegram_data.first_name + 
          (data.telegram_data.last_name ? ` ${data.telegram_data.last_name}` : '');

        const { data: signUpResult, error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: `telegram_${data.telegram_data.id}`,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              auth_method: 'telegram',
              telegram_id: data.telegram_data.id,
              full_name: fullName,
              photo_url: data.telegram_data.photo_url,
              telegram: data.telegram_data.username,
              user_type: 'buyer'
            }
          }
        });

        if (signUpError) {
          throw signUpError;
        }

        if (!signUpResult.session) {
          throw new Error('No session created after sign up');
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