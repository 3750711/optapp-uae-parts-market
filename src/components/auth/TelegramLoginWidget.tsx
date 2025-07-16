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

      // Call the updated telegram-auth Edge Function
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

      if (data.is_existing_user) {
        // Existing user - try to sign in using their email
        const email = data.user_data.email;
        const password = generateTelegramPassword(data.telegram_data.id, email);
        
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (signInError) {
          // If sign in fails, the user might not exist in auth.users yet
          // Try to sign them up first with the same consistent password
          const { error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                auth_method: 'telegram',
                telegram_id: data.telegram_data.id.toString(),
                full_name: data.user_data.full_name,
                photo_url: data.user_data.avatar_url,
                telegram: data.telegram_data.username,
                user_type: data.user_data.user_type || 'buyer'
              }
            }
          });

          if (signUpError) {
            // If signup also fails with "User already registered", try signin again
            if (signUpError.message.includes('User already registered')) {
              const { error: retrySignInError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
              });
              
              if (retrySignInError) {
                throw new Error('Ошибка входа. Обратитесь к администратору.');
              }
            } else {
              throw signUpError;
            }
          }
        }
      } else {
        // New user - sign them up with data from Edge Function
        const email = data.telegram_data.email;
        const password = generateTelegramPassword(data.telegram_data.id, email);

        const { error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              auth_method: data.telegram_data.auth_method,
              telegram_id: data.telegram_data.id.toString(),
              full_name: data.telegram_data.full_name,
              photo_url: data.telegram_data.photo_url,
              telegram: data.telegram_data.username,
              user_type: data.telegram_data.user_type
            }
          }
        });

        if (signUpError) {
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