import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, UserX, Wifi, Shield, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthErrorType, AuthError } from '@/types/auth';

interface AuthErrorAlertProps {
  error: AuthError;
  onClose: () => void;
}

export const AuthErrorAlert: React.FC<AuthErrorAlertProps> = ({ error, onClose }) => {
  const getErrorIcon = () => {
    switch (error.type) {
      case AuthErrorType.INVALID_CREDENTIALS:
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case AuthErrorType.USER_NOT_FOUND:
      case AuthErrorType.OPT_ID_NOT_FOUND:
        return <UserX className="h-4 w-4 text-orange-600" />;
      case AuthErrorType.RATE_LIMITED:
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case AuthErrorType.TELEGRAM_AUTH_CONFLICT:
        return <Shield className="h-4 w-4 text-blue-600" />;
      case AuthErrorType.NETWORK_ERROR:
        return <Wifi className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getAlertStyles = () => {
    switch (error.type) {
      case AuthErrorType.INVALID_CREDENTIALS:
      case AuthErrorType.NETWORK_ERROR:
      case AuthErrorType.GENERIC_ERROR:
        return "border-red-200 bg-red-50 text-red-900";
      case AuthErrorType.USER_NOT_FOUND:
      case AuthErrorType.OPT_ID_NOT_FOUND:
        return "border-orange-200 bg-orange-50 text-orange-900";
      case AuthErrorType.RATE_LIMITED:
        return "border-yellow-200 bg-yellow-50 text-yellow-900";
      case AuthErrorType.TELEGRAM_AUTH_CONFLICT:
        return "border-blue-200 bg-blue-50 text-blue-900";
      default:
        return "border-red-200 bg-red-50 text-red-900";
    }
  };

  return (
    <Alert className={getAlertStyles()}>
      {getErrorIcon()}
      <AlertDescription className="space-y-3">
        <div className="text-sm leading-relaxed">
          {error.message}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          {error.actionText && error.actionLink && (
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
              <Link to={error.actionLink}>
                {error.actionText}
              </Link>
            </Button>
          )}
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