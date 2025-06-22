
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Mail } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EmailChangeFormProps {
  currentEmail: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const EmailChangeForm = ({ currentEmail, onSuccess, onCancel }: EmailChangeFormProps) => {
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const { sendVerificationCode, verifyEmailCode, isLoading } = useEmailVerification();
  const { refreshProfile } = useAuth();

  const handleSendCode = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast({
        title: "Некорректный email",
        description: "Введите корректный email адрес",
        variant: "destructive",
      });
      return;
    }

    if (newEmail === currentEmail) {
      toast({
        title: "Тот же email",
        description: "Новый email должен отличаться от текущего",
        variant: "destructive",
      });
      return;
    }

    const result = await sendVerificationCode(newEmail);
    if (result.success) {
      setStep('verify');
      toast({
        title: "Код отправлен",
        description: "Код подтверждения отправлен на новый email",
      });

      // Для отладки показываем код в консоли
      if (result.code) {
        console.log('🔐 DEBUG: Код для смены email:', result.code);
      }
    } else {
      toast({
        title: "Ошибка отправки",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const sendEmailChangeNotification = async (oldEmail: string, newEmail: string) => {
    try {
      // Отправляем уведомление на старый email
      await fetch(`${supabase.supabaseUrl}/functions/v1/send-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`
        },
        body: JSON.stringify({
          email: oldEmail,
          resetLink: `${window.location.origin}/profile`,
          emailChangeInfo: {
            oldEmail: oldEmail,
            newEmail: newEmail,
            type: 'email_change_notification'
          }
        })
      });

      console.log('Email change notification sent to old email');
    } catch (error) {
      console.error('Error sending email change notification:', error);
    }
  };

  const sendEmailChangeSuccessNotification = async (newEmail: string, oldEmail: string) => {
    try {
      // Отправляем приветственное уведомление на новый email
      await fetch(`${supabase.supabaseUrl}/functions/v1/send-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`
        },
        body: JSON.stringify({
          email: newEmail,
          emailChangeInfo: {
            oldEmail: oldEmail,
            newEmail: newEmail,
            type: 'email_change_success'
          }
        })
      });

      console.log('Email change success notification sent to new email');
    } catch (error) {
      console.error('Error sending email change success notification:', error);
    }
  };

  const handleVerifyAndChange = async () => {
    if (code.length !== 6) {
      toast({
        title: "Неполный код",
        description: "Введите полный 6-значный код",
        variant: "destructive",
      });
      return;
    }

    setIsChanging(true);

    try {
      // Сначала проверяем код
      const verificationResult = await verifyEmailCode(newEmail, code);
      
      if (!verificationResult.success) {
        toast({
          title: "Неверный код",
          description: verificationResult.message,
          variant: "destructive",
        });
        setCode('');
        return;
      }

      // Если код верный, меняем email в Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (updateError) {
        console.error('Error updating email:', updateError);
        toast({
          title: "Ошибка изменения email",
          description: updateError.message,
          variant: "destructive",
        });
        return;
      }

      // Обновляем email в профиле
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ email: newEmail })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (profileError) {
        console.error('Error updating profile email:', profileError);
        toast({
          title: "Ошибка обновления профиля",
          description: "Email изменен, но профиль не обновлен. Обратитесь в поддержку.",
          variant: "destructive",
        });
        return;
      }

      // Отправляем оба уведомления параллельно
      await Promise.all([
        sendEmailChangeNotification(currentEmail, newEmail),
        sendEmailChangeSuccessNotification(newEmail, currentEmail)
      ]);

      // Принудительно обновляем профиль и инвалидируем все кэши
      await refreshProfile();
      
      toast({
        title: "Email изменен",
        description: "Ваш email успешно изменен. Уведомления отправлены на оба адреса: старый (для безопасности) и новый (подтверждение).",
      });

      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Error changing email:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при изменении email",
        variant: "destructive",
      });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-optapp-yellow" />
          Изменение email
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Текущий email: {currentEmail}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {step === 'email' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="newEmail">Новый email адрес</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@email.com"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleSendCode}
                disabled={!newEmail || isLoading}
                className="flex-1 bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
              >
                {isLoading ? "Отправка..." : "Отправить код"}
              </Button>
              
              {onCancel && (
                <Button 
                  onClick={onCancel}
                  variant="outline"
                  disabled={isLoading}
                >
                  Отмена
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Код отправлен на: <span className="font-medium">{newEmail}</span>
              </p>
              
              <Button
                variant="link"
                size="sm"
                onClick={() => setStep('email')}
                className="text-xs"
              >
                Изменить email
              </Button>
            </div>

            <div className="space-y-3">
              <Label>Код подтверждения</Label>
              <div className="flex justify-center">
                <InputOTP
                  value={code}
                  onChange={setCode}
                  maxLength={6}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={handleVerifyAndChange}
                disabled={code.length !== 6 || isChanging}
                className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
              >
                {isChanging ? "Изменение..." : "Изменить email"}
              </Button>

              <Button
                variant="outline"
                onClick={handleSendCode}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Отправка..." : "Отправить код повторно"}
              </Button>

              {onCancel && (
                <Button 
                  onClick={onCancel}
                  variant="ghost"
                  disabled={isChanging}
                  className="w-full"
                >
                  Отмена
                </Button>
              )}
            </div>

            <div className="text-xs text-muted-foreground text-center">
              <p>После изменения email вы получите уведомления на:</p>
              <p>• Старый адрес - уведомление о смене (безопасность)</p>
              <p>• Новый адрес - подтверждение изменения</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailChangeForm;
