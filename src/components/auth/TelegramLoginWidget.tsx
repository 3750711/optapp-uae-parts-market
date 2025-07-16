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
        // Existing user - try to sign in with fallback handling
        const email = data.existing_user_data?.email || data.user_data?.email;
        console.log('Attempting sign in for existing user:', email);
        
        const password = `telegram_${data.telegram_data.id}`;
        
        try {
          const { data: signInResult, error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
          });

          if (signInError) {
            console.error('Sign in error:', signInError.message);
            throw new Error(`Ошибка входа: ${signInError.message}`);
          }

          if (!signInResult.session) {
            throw new Error('No session created after sign in');
          }
        } catch (error) {
          console.error('Sign in process failed:', error);
          throw error;
        }
      } else {
        // New user - sign them up
        // Use same email generation logic as Edge Function
        const telegramId = data.telegram_data.id;
        let email;
        
        // Try username first (if available and valid)
        if (data.telegram_data.username && data.telegram_data.username.trim().length > 0) {
          const cleanUsername = data.telegram_data.username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
          if (cleanUsername.length >= 3) {
            email = `${cleanUsername}.${telegramId}@telegram.partsbay.ae`;
          }
        }
        
        // Fallback to first_name + telegram_id
        if (!email && data.telegram_data.first_name && data.telegram_data.first_name.trim().length > 0) {
          const cleanFirstName = data.telegram_data.first_name.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
          if (cleanFirstName.length >= 2) {
            email = `${cleanFirstName}.${telegramId}@telegram.partsbay.ae`;
          }
        }
        
        // Ultimate fallback
        if (!email) {
          email = `user.${telegramId}@telegram.partsbay.ae`;
        }
        
        console.log('Generated email for new user:', email);
        
        const fullName = data.telegram_data.first_name + 
          (data.telegram_data.last_name ? ` ${data.telegram_data.last_name}` : '');

        try {
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
            console.error('Signup error:', signUpError);
            
            // If "User already registered", try sign in as fallback
            if (signUpError.message.includes('User already registered')) {
              console.log('User already registered, trying sign in as fallback...');
              
              const { data: fallbackSignInResult, error: fallbackSignInError } = await supabase.auth.signInWithPassword({
                email: email,
                password: `telegram_${data.telegram_data.id}`
              });

              if (fallbackSignInError) {
                console.error('Fallback sign in error:', fallbackSignInError.message);
                throw new Error(`Ошибка входа: ${fallbackSignInError.message}`);
              }

              if (!fallbackSignInResult.session) {
                throw new Error('No session created after fallback sign in');
              }
            } else {
              throw new Error(`Ошибка регистрации: ${signUpError.message}`);
            }
          } else if (!signUpResult.session) {
            throw new Error('No session created after sign up');
          }
        } catch (error) {
          console.error('Registration process failed:', error);
          throw error;
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