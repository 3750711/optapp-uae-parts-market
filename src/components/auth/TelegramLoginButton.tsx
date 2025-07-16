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
    console.log('🔧 Initializing Telegram Login Widget');
    console.log('Bot username:', botUsername);

    // Функция обработки ответа от Telegram
    const handleTelegramAuth = async (telegramData: TelegramUser) => {
      try {
        console.log('📝 Received Telegram auth data:', telegramData);

        // Вызываем новую Edge Function
        const { data, error } = await supabase.functions.invoke('telegram-auth-simple', {
          body: { telegramData }
        });

        if (error) {
          console.error('❌ Error from telegram-auth-simple:', error);
          onError(error.message || 'Authentication failed');
          return;
        }

        if (data.success) {
          console.log('✅ Telegram authentication successful');
          onAuth(telegramData, { 
            session: data.session,
            user: data.user,
            profile: data.profile
          });
        } else {
          console.error('❌ Telegram authentication failed:', data.error);
          onError(data.error || 'Authentication failed');
        }
      } catch (error) {
        console.error('❌ Error processing Telegram auth:', error);
        onError(error instanceof Error ? error.message : 'Authentication failed');
      }
    };

    // Создаем глобальную функцию для Telegram callback
    (window as any).onTelegramAuth = handleTelegramAuth;

    // Создаем и добавляем Telegram widget script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', size);
    script.setAttribute('data-radius', cornerRadius.toString());
    script.setAttribute('data-request-access', requestAccess);
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');

    script.onerror = () => {
      console.error('❌ Failed to load Telegram widget script');
      onError('Failed to load Telegram login widget. Please check your internet connection.');
    };

    script.onload = () => {
      console.log('✅ Telegram widget script loaded successfully');
      
      // Проверяем создание виджета через некоторое время
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
      // Очищаем глобальную функцию
      delete (window as any).onTelegramAuth;
    };
  }, [botUsername, size, cornerRadius, requestAccess, onAuth, onError]);

  return (
    <div className={`telegram-login-widget ${className}`}>
      <div ref={widgetRef}></div>
    </div>
  );
};

export default TelegramLoginButton;