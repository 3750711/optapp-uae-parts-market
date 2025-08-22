import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TelegramData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface AccountMergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingEmail: string;
  telegramData: TelegramData;
  onMergeSuccess: (email: string, password: string) => void;
  onCancel: () => void;
  language?: 'ru' | 'en' | 'bn';
}

export const AccountMergeDialog: React.FC<AccountMergeDialogProps> = ({
  open,
  onOpenChange,
  existingEmail,
  telegramData,
  onMergeSuccess,
  onCancel,
  language = 'ru'
}) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Bengali users see English translations  
  const actualLanguage = language === 'bn' ? 'en' : language;
  const t = actualLanguage === 'en' ? {
    title: 'Merge Accounts',
    foundExistingPrefix: 'We found an existing account with the same Telegram:',
    instructions: 'To access your orders and products, enter the password for the existing account. We will merge your accounts and you will be able to login via Telegram.',
    passwordLabelPrefix: 'Password for account',
    passwordPlaceholder: 'Enter password',
    cancel: 'Cancel',
    merging: 'Checking...',
    merge: 'Merge accounts',
    toastEnterPassword: 'Enter a password',
    toastChecking: 'Verifying password and merging accounts...',
    success: 'Accounts merged successfully!',
    genericError: 'Error while merging accounts'
  } : {
    title: 'Объединение аккаунтов',
    foundExistingPrefix: 'Мы нашли существующий аккаунт с таким же Telegram:',
    instructions: 'Чтобы получить доступ к вашим заказам и товарам, введите пароль от существующего аккаунта. Мы объединим ваши аккаунты и вы сможете входить через Telegram.',
    passwordLabelPrefix: 'Пароль от аккаунта',
    passwordPlaceholder: 'Введите пароль',
    cancel: 'Отмена',
    merging: 'Проверяем...',
    merge: 'Объединить аккаунты',
    toastEnterPassword: 'Введите пароль',
    toastChecking: 'Проверяем пароль и объединяем аккаунты...',
    success: 'Аккаунты успешно объединены!',
    genericError: 'Ошибка при объединении аккаунтов'
  };

  const handleMerge = async () => {
  if (!password.trim()) {
    toast.error(t.toastEnterPassword);
    return;
  }

    setIsLoading(true);
    try {
      toast.loading(t.toastChecking);

      const { data, error } = await supabase.functions.invoke('merge-telegram-account', {
        body: {
          existing_email: existingEmail,
          password: password,
          telegram_data: telegramData
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || t.genericError);
      }

      toast.dismiss();
      toast.success(data.message || t.success);
      
      onMergeSuccess(data.email, data.password);
      onOpenChange(false);
      setPassword('');
      
    } catch (error) {
      toast.dismiss();
      const errorMessage = error instanceof Error ? error.message : t.genericError;
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPassword('');
    onOpenChange(false);
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription className="space-y-3">
            <p>
              {t.foundExistingPrefix} <strong>{existingEmail}</strong>
            </p>
            <p>
              {t.instructions}
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t.passwordLabelPrefix} {existingEmail}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.passwordPlaceholder}
              disabled={isLoading}
              onKeyDown={(e) => e.key === 'Enter' && handleMerge()}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {t.cancel}
          </Button>
          <Button 
            onClick={handleMerge}
            disabled={isLoading || !password.trim()}
            className="w-full sm:w-auto"
          >
            {isLoading ? t.merging : t.merge}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};