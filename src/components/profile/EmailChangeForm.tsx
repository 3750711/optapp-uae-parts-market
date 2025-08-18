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
import { getProfileTranslations } from '@/utils/profileTranslations';

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
  const { refreshProfile, profile } = useAuth();
  const t = getProfileTranslations(profile?.user_type || 'buyer');

  const handleSendCode = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast({
        title: t.invalidEmail,
        description: t.invalidEmailDesc,
        variant: "destructive",
      });
      return;
    }

    if (newEmail === currentEmail) {
      toast({
        title: t.sameEmail,
        description: t.sameEmailDesc,
        variant: "destructive",
      });
      return;
    }

    const result = await sendVerificationCode(newEmail);
    if (result.success) {
      setStep('verify');
      toast({
        title: t.codeSent,
        description: t.codeSentDesc,
      });

      // Для отладки показываем код в консоли
      if (result.code) {
        console.log('🔐 DEBUG: Код для смены email:', result.code);
      }
    } else {
      toast({
        title: t.sendError,
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
        title: t.incompleteCode,
        description: t.incompleteCodeDesc,
        variant: "destructive",
      });
      return;
    }

    setIsChanging(true);

    try {
      // Проверяем код 
      const verificationResult = await verifyEmailCode(newEmail, code);
      
      if (!verificationResult.success) {
        toast({
          title: t.invalidCode,
          description: verificationResult.message,
          variant: "destructive",
        });
        setCode('');
        return;
      }

      // После успешной верификации кода, выполняем смену email вручную
      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (updateError) {
        toast({
          title: t.updateEmailError,
          description: t.updateEmailErrorDesc,
          variant: "destructive",
        });
        return;
      }

      // Отправляем уведомления на оба email параллельно
      await Promise.all([
        sendEmailChangeNotification(currentEmail, newEmail),
        sendEmailChangeSuccessNotification(newEmail, currentEmail)
      ]);

      // Принудительно обновляем профиль и инвалидируем все кэши
      await refreshProfile();
      
      toast({
        title: t.emailChanged,
        description: t.emailChangedDesc,
      });

      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Error changing email:', error);
      toast({
        title: t.changeEmailError,
        description: t.changeEmailErrorDesc,
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
          {t.emailChangeTitle}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t.currentEmail} {currentEmail}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {step === 'email' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="newEmail">{t.newEmailLabel}</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={t.newEmailPlaceholder}
                disabled={isLoading}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleSendCode}
                disabled={!newEmail || isLoading}
                className="flex-1 bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
              >
                {isLoading ? t.sending : t.sendCode}
              </Button>
              
              {onCancel && (
                <Button 
                  onClick={onCancel}
                  variant="outline"
                  disabled={isLoading}
                >
                  {t.cancel}
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {t.emailSentTo} <span className="font-medium">{newEmail}</span>
              </p>
              
              <Button
                variant="link"
                size="sm"
                onClick={() => setStep('email')}
                className="text-xs"
              >
                {t.changeEmail2}
              </Button>
            </div>

            <div className="space-y-3">
              <Label>{t.verificationCode}</Label>
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
                {isChanging ? t.changing : t.changeEmailAction}
              </Button>

              <Button
                variant="outline"
                onClick={handleSendCode}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? t.sending : t.resendCode}
              </Button>

              {onCancel && (
                <Button 
                  onClick={onCancel}
                  variant="ghost"
                  disabled={isChanging}
                  className="w-full"
                >
                  {t.cancel}
                </Button>
              )}
            </div>

            <div className="text-xs text-muted-foreground text-center">
              <p>{t.emailChangeNotification}</p>
              <p>{t.emailChangeOldNotification}</p>
              <p>{t.emailChangeNewNotification}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailChangeForm;