import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Shield, Zap, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TelegramLoginWidget } from './TelegramLoginWidget';
import LoginForm from './LoginForm';

interface ProfessionalAuthBlockProps {
  language?: 'ru' | 'en';
}

const authTranslations = {
  ru: {
    features: {
      secure: "Безопасно",
      instant: "Мгновенно"
    },
    alternativeLogin: "Классический вход",
    alternativeDescription: "Альтернативный способ входа",
    registerPrompt: "Нет аккаунта?",
    registerLink: "Зарегистрироваться"
  },
  en: {
    features: {
      secure: "Secure",
      instant: "Instant"
    },
    alternativeLogin: "Traditional login",
    alternativeDescription: "Alternative login method",
    registerPrompt: "No account?",
    registerLink: "Register"
  }
};

export const ProfessionalAuthBlock: React.FC<ProfessionalAuthBlockProps> = ({ 
  language = 'ru' 
}) => {
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const t = authTranslations[language];

  const handleTelegramSuccess = () => {
    // Handle successful Telegram login
  };

  const handleTelegramError = (error: string) => {
    console.error('Telegram login error:', error);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-card/90 backdrop-blur-sm rounded-2xl shadow-card-elegant border border-border/20 p-8">
        {/* Primary Telegram Auth */}
        <div className="mb-8">
          <TelegramLoginWidget 
            onSuccess={handleTelegramSuccess}
            onError={handleTelegramError}
          />
        </div>

        {/* Features highlights */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">{t.features.secure}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">{t.features.instant}</span>
          </div>
        </div>

        {/* Alternative login toggle */}
        <div className="border-t border-border/30 pt-6">
          <Button
            variant="ghost"
            onClick={() => setShowEmailLogin(!showEmailLogin)}
            className="w-full flex items-center justify-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{t.alternativeLogin}</span>
            {showEmailLogin ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>

          {showEmailLogin && (
            <div className="mt-4 p-4 bg-muted/20 rounded-lg">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  {t.alternativeDescription}
                </p>
              </div>
              <LoginForm />
            </div>
          )}
        </div>

        {/* Bottom links */}
        <div className="mt-6 text-center space-y-2">
          <div className="text-xs text-muted-foreground">
            {t.registerPrompt}{' '}
            <Link
              to="/register"
              className="text-primary hover:text-primary-hover font-medium transition-colors"
            >
              {t.registerLink}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};