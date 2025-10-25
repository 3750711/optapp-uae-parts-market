import React, { useState, useEffect } from 'react';
import { Lock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authPrompt } from '@/utils/translations/authPrompt';
import { Lang } from '@/types/i18n';

interface AuthPromptOverlayProps {
  language: Lang;
  onLogin: () => void;
  onRegister: () => void;
}

const STORAGE_KEY = 'pb:authPromptClosed';

export const AuthPromptOverlay: React.FC<AuthPromptOverlayProps> = ({
  language,
  onLogin,
  onRegister
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const t = authPrompt[language];

  // Load visibility state from sessionStorage
  useEffect(() => {
    const wasClosed = sessionStorage.getItem(STORAGE_KEY);
    if (wasClosed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem(STORAGE_KEY, 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-primary/95 backdrop-blur-md border-t border-primary-foreground/10 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Icon & Text */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-primary-foreground font-semibold text-sm sm:text-base">
                  {t.overlayTitle}
                </h3>
                <p className="text-primary-foreground/80 text-xs sm:text-sm">
                  {t.overlayDescription}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={onLogin}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-medium"
                size="sm"
              >
                {t.loginButton}
              </Button>
              <Button
                onClick={onRegister}
                variant="outline"
                className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                size="sm"
              >
                {t.registerButton}
              </Button>
              <Button
                onClick={handleClose}
                variant="ghost"
                size="icon"
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 flex-shrink-0"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">{t.closeButton}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
