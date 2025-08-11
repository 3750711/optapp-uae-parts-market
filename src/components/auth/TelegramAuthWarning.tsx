import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';

interface TelegramAuthWarningProps {
  onClose: () => void;
}

export const TelegramAuthWarning: React.FC<TelegramAuthWarningProps> = ({ onClose }) => {
  const { language } = useLanguage();
  const t = language === 'en' ? {
    title: 'Account linked to Telegram',
    description: 'For security, when you sign in via Telegram your password is changed automatically. If you want to sign in by email, you need to reset your password — it will remain valid until the next time you use Telegram login.',
    reset: 'Reset password',
    ok: 'Got it'
  } : {
    title: 'Аккаунт привязан к Telegram',
    description: 'В целях безопасности при входе через Telegram пароль изменяется автоматически. Если вы хотите войти через почту, необходимо восстановить пароль — он будет действовать до следующего использования входа через Telegram.',
    reset: 'Восстановить пароль',
    ok: 'Понятно'
  };
  return (
    <Alert className="border-orange-200 bg-orange-50 text-orange-900">
      <Shield className="h-4 w-4 text-orange-600" />
      <AlertDescription className="space-y-3">
        <div className="font-medium">{t.title}</div>
        <div className="text-sm leading-relaxed">{t.description}</div>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link to="/forgot-password" className="flex items-center gap-2">
              {t.reset}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {t.ok}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};