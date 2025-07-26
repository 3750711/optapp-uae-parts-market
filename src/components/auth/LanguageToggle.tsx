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
    <div className={cn("flex items-center bg-muted/50 rounded-lg p-1", className)}>
      <div className="flex items-center gap-1">
        <Globe className="h-3 w-3 text-muted-foreground" />
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className={cn(
            "h-8 px-3 text-xs font-medium transition-all",
            language === 'ru' 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          RU
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className={cn(
            "h-8 px-3 text-xs font-medium transition-all",
            language === 'en' 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          EN
        </Button>
      </div>
    </div>
  );
};

export default LanguageToggle;