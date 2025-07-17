import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TelegramAuthWarningProps {
  onClose: () => void;
}

export const TelegramAuthWarning: React.FC<TelegramAuthWarningProps> = ({ onClose }) => {
  return (
    <Alert className="border-orange-200 bg-orange-50 text-orange-900">
      <Shield className="h-4 w-4 text-orange-600" />
      <AlertDescription className="space-y-3">
        <div className="font-medium">
          Аккаунт привязан к Telegram
        </div>
        <div className="text-sm leading-relaxed">
          В целях безопасности при входе через Telegram пароль изменяется автоматически. 
          Если вы хотите войти через почту, необходимо восстановить пароль — он будет 
          действовать до следующего использования входа через Telegram.
        </div>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link to="/forgot-password" className="flex items-center gap-2">
              Восстановить пароль
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Понятно
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};