import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AccountMergeDialog } from './AccountMergeDialog';

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
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeData, setMergeData] = useState<{
    existingEmail: string;
    telegramData: any;
  } | null>(null);

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

  const handleTelegramAuth = async (authData: TelegramAuthData) => {
    try {
      toast.loading('Авторизация через Telegram...');

      // Call the telegram-widget-auth Edge Function
      const { data, error } = await supabase.functions.invoke('telegram-widget-auth', {
        body: { authData }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Authentication failed');
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

      console.log('🔍 Edge Function response:', data);

      // Handle normal login flow
      await handleDirectLogin(data.email, data.password, data.is_new_user);

    } catch (error) {
      toast.dismiss();
      const errorMessage = error instanceof Error ? error.message : 'Ошибка авторизации';
      toast.error(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleDirectLogin = async (email: string, password: string, isNewUser: boolean) => {
    try {

      if (!isNewUser) {
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
        // New user case is not handled in direct login as it should be processed by Edge Function
        throw new Error('New user creation should be handled by Edge Function');
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

  const handleMergeSuccess = async (email: string, password: string) => {
    try {
      await handleDirectLogin(email, password, false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка после объединения аккаунтов';
      toast.error(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleMergeCancel = async () => {
    // User chose to create a new account instead of merging
    // We can optionally implement creating a new account with a different identifier
    toast.info('Вы можете создать новый аккаунт через обычную регистрацию');
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
    <>
      <div className="flex flex-col items-center space-y-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Профессиональная авторизация
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Безопасный вход через Telegram для участников B2B/B2C сообщества
          </p>
        </div>
        <div ref={widgetRef} className="telegram-widget-container scale-110" />
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Мгновенная авторизация без дополнительных паролей
          </p>
          <p className="text-xs text-primary font-medium">
            Рекомендованный способ входа
          </p>
        </div>
      </div>

      {mergeData && (
        <AccountMergeDialog
          open={mergeDialogOpen}
          onOpenChange={setMergeDialogOpen}
          existingEmail={mergeData.existingEmail}
          telegramData={mergeData.telegramData}
          onMergeSuccess={handleMergeSuccess}
          onCancel={handleMergeCancel}
        />
      )}
    </>
  );
};