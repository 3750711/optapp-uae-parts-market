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
      {/* Backdrop blur overlay */}
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm -z-10" />
      
      <div className="bg-gradient-to-r from-primary to-primary/90 backdrop-blur-md border-t-2 border-primary-foreground/20 shadow-2xl">
        <div className="max-w-4xl mx-auto px-4 py-5 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            {/* Icon & Text */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-foreground/15 flex items-center justify-center ring-2 ring-primary-foreground/20">
                <Lock className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-primary-foreground font-bold text-base sm:text-lg mb-1">
                  {t.overlayTitle}
                </h3>
                <p className="text-primary-foreground/90 text-sm sm:text-base">
                  {t.overlayDescription}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={onLogin}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold shadow-md"
                size="default"
              >
                {t.loginButton}
              </Button>
              <Button
                onClick={onRegister}
                variant="outline"
                className="border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/15 font-semibold"
                size="default"
              >
                {t.registerButton}
              </Button>
              <Button
                onClick={handleClose}
                variant="ghost"
                size="icon"
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/20 flex-shrink-0"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">{t.closeButton}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
