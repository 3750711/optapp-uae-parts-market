
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

interface SessionStatusComponentProps {
  isComponentReady: boolean;
  sessionLost: boolean;
  uploadError: string | null;
  onSessionRecovery: () => void;
  onReset: () => void;
}

export const SessionStatusComponent: React.FC<SessionStatusComponentProps> = ({
  isComponentReady,
  sessionLost,
  uploadError,
  onSessionRecovery,
  onReset
}) => {
  if (sessionLost) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="space-y-2">
          <p>Потеряна сессия администратора. Необходимо восстановить доступ.</p>
          <Button onClick={onSessionRecovery} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Восстановить сессию
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!isComponentReady) {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription>
          Инициализация компонента загрузки...
        </AlertDescription>
      </Alert>
    );
  }

  if (uploadError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="space-y-2">
          <p>Ошибка: {uploadError}</p>
          <Button onClick={onReset} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Сбросить и попробовать снова
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
