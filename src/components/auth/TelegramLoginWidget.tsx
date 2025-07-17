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

      console.log('🔍 Edge Function response:', {
        is_existing_user: data.is_existing_user,
        email: data.telegram_data.email,
        full_response: data
      });

      // Generate cryptographically secure random password for Telegram users
      const generateSecurePassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
        const array = new Uint8Array(32); // 32 characters minimum
        crypto.getRandomValues(array);
        return Array.from(array, byte => chars[byte % chars.length]).join('');
      };

      const email = data.telegram_data.email;
      const password = generateSecurePassword();

      console.log('🔑 Generated email and password for:', email);

      if (data.is_existing_user === true) {
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
        // New user: use signUp
        console.log('🎯 Using signUp for new user:', email);

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
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
          console.error('signUp error:', signUpError);
          throw signUpError;
        }

        console.log('✅ User created successfully:', signUpData);
        
        // Verify that the user was created and has a session
        if (!signUpData.user) {
          console.error('❌ No user returned from signUp');
          throw new Error('User creation failed - no user data returned');
        }

        // Create profile manually since Supabase doesn't allow triggers on auth.users
        console.log('📝 Creating profile manually for user:', signUpData.user.id);
        
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: signUpData.user.id,
              email: email,
              auth_method: 'telegram',
              full_name: data.telegram_data.full_name,
              telegram_id: data.telegram_data.id,
              telegram: data.telegram_data.username,
              avatar_url: data.telegram_data.photo_url,
              user_type: data.telegram_data.user_type || 'buyer'
            });

          if (profileError) {
            // If telegram_id already exists, try without it
            if (profileError.code === '23505' && profileError.message?.includes('telegram_id')) {
              console.log('🔄 Telegram ID already exists, creating profile without telegram_id');
              const { error: retryError } = await supabase
                .from('profiles')
                .insert({
                  id: signUpData.user.id,
                  email: email,
                  auth_method: 'telegram',
                  full_name: data.telegram_data.full_name,
                  telegram: data.telegram_data.username,
                  avatar_url: data.telegram_data.photo_url,
                  user_type: data.telegram_data.user_type || 'buyer'
                });
              
              if (retryError) {
                console.error('❌ Profile creation failed even without telegram_id:', retryError);
                throw new Error('Profile creation failed - please contact support');
              }
              console.log('✅ Profile created successfully without telegram_id');
            } else {
              console.error('❌ Profile creation failed:', profileError);
              throw new Error('Profile creation failed - please contact support');
            }
          } else {
            console.log('✅ Profile created successfully with telegram_id');
          }
        } catch (error) {
          console.error('❌ Unexpected error during profile creation:', error);
          throw new Error('Profile creation failed - please contact support');
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