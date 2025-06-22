
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Clock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useEmailVerification } from '@/hooks/useEmailVerification';

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
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(true);
  
  const { sendVerificationCode, verifyEmailCode, isLoading } = useEmailVerification();

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

  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Некорректный email",
        description: "Введите корректный email адрес",
        variant: "destructive",
      });
      return;
    }

    const result = await sendVerificationCode(email);

    if (result.success) {
      setStep('code');
      setTimeLeft(300); // 5 минут
      setCanResend(false);
      
      toast({
        title: "Код отправлен",
        description: result.message,
      });

      // Для отладки показываем код в консоли
      if (result.code) {
        console.log('🔐 DEBUG: Код верификации:', result.code);
      }
    } else {
      toast({
        title: "Ошибка отправки",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      toast({
        title: "Неполный код",
        description: "Введите полный 6-значный код",
        variant: "destructive",
      });
      return;
    }

    const result = await verifyEmailCode(email, code);

    if (result.success) {
      toast({
        title: "Email подтвержден",
        description: result.message,
      });
      onVerificationSuccess(email);
    } else {
      toast({
        title: "Неверный код",
        description: result.message,
        variant: "destructive",
      });
      setCode('');
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
                onClick={handleSendCode}
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
              <Label htmlFor="code">Код подтверждения (6 цифр)</Label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={(e) => {
                  console.log("EmailVerification code input:", {
                    inputValue: e.target.value,
                    currentCode: code,
                    email: email
                  });
                  
                  const numericValue = e.target.value.replace(/[^0-9]/g, '');
                  if (numericValue.length <= 6) {
                    setCode(numericValue);
                  }
                }}
                placeholder="123456"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                className="text-center text-xl tracking-widest font-mono"
                disabled={isLoading}
                autoComplete="off"
              />
            </div>

            {timeLeft > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Код действителен: {formatTime(timeLeft)}</span>
              </div>
            )}

            <div className="space-y-2">
              <Button 
                onClick={handleVerifyCode}
                disabled={code.length !== 6 || isLoading}
                className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
              >
                {isLoading ? "Проверка..." : "Подтвердить"}
              </Button>

              <Button
                variant="outline"
                onClick={handleSendCode}
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
