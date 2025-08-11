import React from 'react';
import { Link } from 'react-router-dom';
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
    orText: "или",
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
    orText: "or",
    registerPrompt: "No account?",
    registerLink: "Register"
  }
};

export const ProfessionalAuthBlock: React.FC<ProfessionalAuthBlockProps> = ({ 
  language = 'ru' 
}) => {
  
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
        {/* Unified compact auth block */}
        <div className="mb-6">
          <TelegramLoginWidget 
            onSuccess={handleTelegramSuccess}
            onError={handleTelegramError}
            language={language}
            compact
          />
        </div>

        {/* OR divider */}
        <div className="relative my-4">
          <div className="flex items-center">
            <div className="flex-1 border-t border-border/30" />
            <span className="mx-3 text-xs text-muted-foreground select-none uppercase tracking-wide">
              {t.orText}
            </span>
            <div className="flex-1 border-t border-border/30" />
          </div>
        </div>

        {/* Compact email login */}
        <div className="mt-4">
          <LoginForm language={language} compact hideHeader hideLinks />
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