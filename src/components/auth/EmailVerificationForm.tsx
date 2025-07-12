
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
  initialEmail, 
  onVerificationSuccess, 
  onCancel,
  title = "Подтверждение email",
  description = "Введите код, отправленный на вашу почту"
}: EmailVerificationFormProps) => {
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

  // Автоматически отправляем код при монтировании компонента
  useEffect(() => {
    if (initialEmail) {
      handleSendCode();
    }
  }, [initialEmail]);

  const handleSendCode = async () => {
    if (!initialEmail) return;
    
    const result = await sendVerificationCode(initialEmail);

    if (result.success) {
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

  const handleVerifyCode = async (codeToVerify?: string) => {
    const verificationCode = codeToVerify || code;
    
    if (verificationCode.length !== 6) {
      toast({
        title: "Неполный код",
        description: "Введите полный 6-значный код",
        variant: "destructive",
      });
      return;
    }

    if (!initialEmail) return;
    
    const result = await verifyEmailCode(initialEmail, verificationCode);

    if (result.success) {
      toast({
        title: "Email подтвержден",
        description: result.message,
      });
      onVerificationSuccess(initialEmail);
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
        {!initialEmail ? (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Необходимо указать email для верификации
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Код отправлен на: <span className="font-medium">{initialEmail}</span>
              </p>
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
                  email: initialEmail
                });
                
                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                if (numericValue.length <= 6) {
                  setCode(numericValue);
                  
                   // Автоматически подтверждаем когда введены все 6 цифр
                   if (numericValue.length === 6) {
                     setTimeout(() => {
                       handleVerifyCode(numericValue);
                     }, 100);
                   }
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
              onClick={() => handleVerifyCode()}
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
