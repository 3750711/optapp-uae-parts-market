
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Mail, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EmailVerificationFormProps {
  initialEmail?: string;
  onVerificationSuccess: (email: string) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
}

const EmailVerificationForm = ({ 
  initialEmail = '', 
  onVerificationSuccess, 
  onCancel,
  title = "Подтверждение email",
  description = "Введите код, отправленный на вашу почту"
}: EmailVerificationFormProps) => {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // Таймер обратного отсчета
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Если передан email, сразу переходим к вводу кода
  useEffect(() => {
    if (initialEmail) {
      setStep('code');
    }
  }, [initialEmail]);

  const sendVerificationCode = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Некорректный email",
        description: "Введите корректный email адрес",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/send-email-verification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabase.supabaseKey}`
          },
          body: JSON.stringify({ email })
        }
      );

      const result = await response.json();

      if (result.success) {
        setStep('code');
        setTimeLeft(300); // 5 минут
        setCanResend(false);
        
        toast({
          title: "Код отправлен",
          description: result.message,
        });
      } else {
        toast({
          title: "Ошибка отправки",
          description: result.message || "Не удалось отправить код",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при отправке кода",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      toast({
        title: "Неполный код",
        description: "Введите полный 6-значный код",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc('verify_email_code', {
        p_email: email,
        p_code: code
      });

      if (error) {
        console.error('Error verifying code:', error);
        toast({
          title: "Ошибка проверки",
          description: "Произошла ошибка при проверке кода",
          variant: "destructive",
        });
        return;
      }

      if (data.success) {
        toast({
          title: "Email подтвержден",
          description: data.message,
        });
        onVerificationSuccess(email);
      } else {
        toast({
          title: "Неверный код",
          description: data.message,
          variant: "destructive",
        });
        setCode('');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при проверке кода",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-optapp-yellow" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {step === 'email' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email адрес</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={sendVerificationCode}
                disabled={!email || isLoading}
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

        {step === 'code' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Код отправлен на: <span className="font-medium">{email}</span>
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

            {timeLeft > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Код действителен: {formatTime(timeLeft)}</span>
              </div>
            )}

            <div className="space-y-2">
              <Button 
                onClick={verifyCode}
                disabled={code.length !== 6 || isLoading}
                className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
              >
                {isLoading ? "Проверка..." : "Подтвердить"}
              </Button>

              <Button
                variant="outline"
                onClick={sendVerificationCode}
                disabled={!canResend || isLoading}
                className="w-full"
              >
                {canResend ? "Отправить код повторно" : `Повтор через ${formatTime(timeLeft)}`}
              </Button>

              {onCancel && (
                <Button 
                  onClick={onCancel}
                  variant="ghost"
                  disabled={isLoading}
                  className="w-full"
                >
                  Отмена
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailVerificationForm;
