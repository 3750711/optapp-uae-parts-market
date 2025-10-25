import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAuthPromptTranslations } from '@/utils/translations/authPrompt';

interface AuthPromptOverlayProps {
  language: 'ru' | 'en' | 'bn';
  onLogin: () => void;
  onRegister: () => void;
}

const STORAGE_KEY = 'auth-prompt-dismissed';

export const AuthPromptOverlay: React.FC<AuthPromptOverlayProps> = ({
  language,
  onLogin,
  onRegister
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const t = getAuthPromptTranslations(language);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-primary/95 backdrop-blur-md border-t border-primary/20 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-primary-foreground mb-1">
                {t.overlayTitle}
              </h3>
              <p className="text-xs text-primary-foreground/80">
                {t.overlayDescription}
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={onLogin}
                  variant="secondary"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {t.loginButton}
                </Button>
                <Button 
                  onClick={onRegister}
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap bg-background/10 hover:bg-background/20 text-primary-foreground border-primary-foreground/20"
                >
                  {t.registerButton}
                </Button>
              </div>
              
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
