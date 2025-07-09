import React, { useState } from 'react';
import { AlertCircle, Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { toast } from '@/hooks/use-toast';

interface EmailVerificationBannerProps {
  onClose?: () => void;
}

const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({ onClose }) => {
  const { user, refreshProfile } = useAuth();
  const { sendVerificationCode, verifyEmailCode, isLoading } = useEmailVerification();
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);

  const handleSendCode = async () => {
    if (!user?.email) {
      toast({
        title: "Ошибка",
        description: "Email не найден",
        variant: "destructive",
      });
      return;
    }

    const result = await sendVerificationCode(user.email);
    
    if (result.success) {
      setIsCodeSent(true);
      toast({
        title: "Код отправлен",
        description: result.message,
      });
    } else {
      toast({
        title: "Ошибка отправки",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handleVerifyCode = async () => {
    if (!user?.email) {
      toast({
        title: "Ошибка",
        description: "Email не найден",
        variant: "destructive",
      });
      return;
    }

    if (!verificationCode.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите код подтверждения",
        variant: "destructive",
      });
      return;
    }

    const result = await verifyEmailCode(user.email, verificationCode.trim());
    
    if (result.success) {
      toast({
        title: "Успешно",
        description: result.message,
      });
      await refreshProfile();
      onClose?.();
    } else {
      toast({
        title: "Ошибка",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Alert className="border-amber-200 bg-amber-50 text-amber-800 relative">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <p className="font-medium">Подтвердите ваш email адрес</p>
            <p className="text-sm text-amber-700 mt-1">
              Для полного доступа к функциям сайта необходимо подтвердить email: {user?.email}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 min-w-0">
            {!isCodeSent ? (
              <Button
                onClick={handleSendCode}
                disabled={isLoading}
                size="sm"
                className="whitespace-nowrap"
              >
                <Mail className="h-4 w-4 mr-2" />
                Отправить код
              </Button>
            ) : (
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Введите код"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  className="w-32"
                />
                <Button
                  onClick={handleVerifyCode}
                  disabled={isLoading}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  Проверить
                </Button>
                <Button
                  onClick={handleSendCode}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  Отправить снова
                </Button>
              </div>
            )}
          </div>
        </div>
      </AlertDescription>
      
      {onClose && (
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
};

export default EmailVerificationBanner;