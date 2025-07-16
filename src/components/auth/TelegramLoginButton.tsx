import React, { useEffect, useRef } from 'react';

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
    // Debug: Log current domain information
    console.log('🔧 Telegram Widget Debug Info:');
    console.log('Current URL:', window.location.href);
    console.log('Domain:', window.location.hostname);
    console.log('Protocol:', window.location.protocol);
    console.log('Bot username:', botUsername);

    // Message listener for popup communication
    const handleMessage = (event: MessageEvent) => {
      // Check origin for security
      if (event.origin !== 'https://vfiylfljiixqkjfqubyq.supabase.co') {
        return;
      }
      
      console.log('Received message from popup:', event.data);
      
      if (event.data.type === 'TELEGRAM_AUTH_SUCCESS') {
        console.log('✅ Authentication successful from popup');
        onAuth(event.data.user, { session: event.data.session });
      } else if (event.data.type === 'TELEGRAM_AUTH_ERROR') {
        console.error('❌ Authentication error from popup:', event.data.error);
        onError(event.data.error || 'Authentication failed');
      }
    };
    
    window.addEventListener('message', handleMessage);

    // Create and append the Telegram widget script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', size);
    script.setAttribute('data-radius', cornerRadius.toString());
    script.setAttribute('data-request-access', requestAccess);
    script.setAttribute('data-auth-url', 'https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/telegram-complete-auth');

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
      window.removeEventListener('message', handleMessage);
    };
  }, [botUsername, size, cornerRadius, requestAccess, onAuth, onError]);

  return (
    <div className={`telegram-login-widget ${className}`}>
      <div ref={widgetRef}></div>
    </div>
  );
};

export default TelegramLoginButton;