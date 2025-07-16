import React, { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginButtonProps {
  botUsername: string;
  onAuth: (user: TelegramUser, authResult: any) => void;
  onError: (error: string) => void;
  className?: string;
  size?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: 'write';
}

declare global {
  interface Window {
    TelegramLoginWidget: {
      dataOnAuth: (user: TelegramUser) => void;
    };
  }
}

const TelegramLoginButton: React.FC<TelegramLoginButtonProps> = ({
  botUsername,
  onAuth,
  onError,
  className = '',
  size = 'large',
  cornerRadius = 10,
  requestAccess = 'write'
}) => {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Debug: Log current domain information
    console.log('🔧 Telegram Widget Debug Info:');
    console.log('Current URL:', window.location.href);
    console.log('Domain:', window.location.hostname);
    console.log('Protocol:', window.location.protocol);
    console.log('Bot username:', botUsername);

    // Define the callback function for Telegram widget
    window.TelegramLoginWidget = {
      dataOnAuth: async (user: TelegramUser) => {
        try {
          console.log('📱 Telegram auth data received:', user);
          
          // Send auth data to our NEW simplified Edge Function
          console.log('🚀 Calling telegram-simple-auth...');
          const { data, error } = await supabase.functions.invoke('telegram-simple-auth', {
            body: user
          });

          if (error) {
            console.error('❌ Edge Function error:', error);
            onError(error.message || 'Authentication failed');
            return;
          }

          console.log('📦 Edge Function response:', data);

          if (data?.success && data?.email && data?.password) {
            console.log('✅ Verification successful, signing in...');
            
            // Sign in with the credentials from our simplified function
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
              email: data.email,
              password: data.password
            });

            if (authError) {
              console.error('❌ Supabase sign in error:', authError);
              onError(authError.message || 'Sign in failed');
              return;
            }

            if (authData?.session) {
              console.log('🎉 Telegram authentication successful!');
              onAuth(user, authData);
            } else {
              console.error('❌ No session created');
              onError('Failed to create session');
            }
          } else {
            console.error('❌ Authentication failed:', data);
            onError(data?.error || 'Authentication failed');
          }
        } catch (error) {
          console.error('💥 Error during Telegram authentication:', error);
          onError('Authentication failed. Please try again.');
        }
      }
    };

    // Create and append the Telegram widget script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', size);
    script.setAttribute('data-radius', cornerRadius.toString());
    script.setAttribute('data-request-access', requestAccess);
    script.setAttribute('data-onauth', 'TelegramLoginWidget.dataOnAuth(user)');

    // Add error handling for script loading
    script.onerror = () => {
      console.error('❌ Failed to load Telegram widget script');
      onError('Failed to load Telegram login widget. Please check your internet connection.');
    };

    script.onload = () => {
      console.log('✅ Telegram widget script loaded successfully');
      
      // Check for domain errors after a short delay
      setTimeout(() => {
        const widget = widgetRef.current?.querySelector('iframe');
        if (widget) {
          console.log('✅ Telegram widget iframe created');
        } else {
          console.warn('⚠️ No Telegram widget iframe found - possible domain issue');
          onError(`Domain validation failed. Make sure ${window.location.hostname} is registered in @BotFather for bot @${botUsername}`);
        }
      }, 2000);
    };

    if (widgetRef.current) {
      widgetRef.current.appendChild(script);
    }

    // Cleanup function
    return () => {
      if (widgetRef.current && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window.TelegramLoginWidget;
    };
  }, [botUsername, size, cornerRadius, requestAccess, onAuth, onError]);

  return (
    <div className={`telegram-login-widget ${className}`}>
      <div ref={widgetRef}></div>
    </div>
  );
};

export default TelegramLoginButton;