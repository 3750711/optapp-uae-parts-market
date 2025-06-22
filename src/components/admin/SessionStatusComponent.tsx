
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  if (!isComponentReady) {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription className="text-xs sm:text-sm">
          Инициализация компонента... Пожалуйста, подождите.
        </AlertDescription>
      </Alert>
    );
  }

  if (sessionLost) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-xs sm:text-sm">Сессия потеряна. Необходимо восстановить соединение для загрузки файлов.</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onSessionRecovery}
            className="h-6 px-2 text-xs self-start sm:self-center"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Восстановить
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (uploadError && !sessionLost) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-xs sm:text-sm">{uploadError}</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onReset}
            className="h-6 px-2 text-xs self-start sm:self-center"
          >
            Попробовать снова
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
