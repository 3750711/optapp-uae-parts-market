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
    // Define the callback function for Telegram widget
    window.TelegramLoginWidget = {
      dataOnAuth: async (user: TelegramUser) => {
        try {
          console.log('Telegram auth data received:', user);
          
          // Send auth data to our Edge Function
          const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
            body: {
              telegramAuth: user
            }
          });

          if (error) {
            console.error('Telegram auth error:', error);
            onError(error.message || 'Authentication failed');
            return;
          }

          if (!data.success) {
            console.error('Telegram auth failed:', data.error);
            onError(data.error || 'Authentication failed');
            return;
          }

          console.log('Telegram auth successful:', data);
          onAuth(user, data);
        } catch (error) {
          console.error('Error during Telegram authentication:', error);
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