import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { clearAllStorageData } from '@/utils/localStorage';

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
}

interface AuthErrorFallbackProps {
  authError: string;
  onClearError: () => void;
  onForceReauth: () => void;
}

const AuthErrorFallback: React.FC<AuthErrorFallbackProps> = ({
  authError,
  onClearError,
  onForceReauth,
}) => {
  const handleClearDataAndReauth = () => {
    clearAllStorageData();
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4 p-6 bg-card rounded-lg border">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <h2 className="text-lg font-semibold text-foreground">
            Authentication Issue
          </h2>
        </div>
        
        <p className="text-muted-foreground mb-6">
          {authError}
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={onClearError}
            variant="outline" 
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          <Button 
            onClick={onForceReauth}
            variant="outline" 
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Session & Login
          </Button>
          
          <Button 
            onClick={handleClearDataAndReauth}
            variant="destructive" 
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Data & Reload
          </Button>
        </div>
        
        <div className="mt-6 text-xs text-muted-foreground">
          <p>If the problem persists:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Check your internet connection</li>
            <li>Try clearing browser cache</li>
            <li>Disable browser extensions</li>
            <li>Try incognito/private mode</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export const AuthErrorBoundary: React.FC<AuthErrorBoundaryProps> = ({ children }) => {
  const { authError, clearAuthError, forceReauth } = useAuth();

  if (authError) {
    return (
      <AuthErrorFallback
        authError={authError}
        onClearError={clearAuthError}
        onForceReauth={forceReauth}
      />
    );
  }

  return <>{children}</>;
};