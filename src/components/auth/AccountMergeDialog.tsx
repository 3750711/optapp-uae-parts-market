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
}

export const AccountMergeDialog: React.FC<AccountMergeDialogProps> = ({
  open,
  onOpenChange,
  existingEmail,
  telegramData,
  onMergeSuccess,
  onCancel
}) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleMerge = async () => {
    if (!password.trim()) {
      toast.error('Введите пароль');
      return;
    }

    setIsLoading(true);
    try {
      toast.loading('Проверяем пароль и объединяем аккаунты...');

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
        throw new Error(data.error || 'Ошибка при объединении аккаунтов');
      }

      toast.dismiss();
      toast.success(data.message || 'Аккаунты успешно объединены!');
      
      onMergeSuccess(data.email, data.password);
      onOpenChange(false);
      setPassword('');
      
    } catch (error) {
      toast.dismiss();
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при объединении аккаунтов';
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
          <DialogTitle>Объединение аккаунтов</DialogTitle>
          <DialogDescription className="space-y-3">
            <p>
              Мы нашли существующий аккаунт с таким же Telegram: <strong>{existingEmail}</strong>
            </p>
            <p>
              Чтобы получить доступ к вашим заказам и товарам, введите пароль от существующего аккаунта.
              Мы объединим ваши аккаунты и вы сможете входить через Telegram.
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Пароль от аккаунта {existingEmail}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
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
            Создать новый аккаунт
          </Button>
          <Button 
            onClick={handleMerge}
            disabled={isLoading || !password.trim()}
            className="w-full sm:w-auto"
          >
            {isLoading ? 'Проверяем...' : 'Объединить аккаунты'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};