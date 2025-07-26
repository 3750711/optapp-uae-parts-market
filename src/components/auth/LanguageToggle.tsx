import React from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  language: 'ru' | 'en';
  onLanguageChange: (language: 'ru' | 'en') => void;
  className?: string;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({
  language,
  onLanguageChange,
  className
}) => {
  const toggleLanguage = () => {
    const newLanguage = language === 'ru' ? 'en' : 'ru';
    onLanguageChange(newLanguage);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className={cn(
        "flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm font-medium">
        {language === 'ru' ? 'РУС' : 'ENG'}
      </span>
    </Button>
  );
};

export default LanguageToggle;