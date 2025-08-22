import React from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  language: 'ru' | 'en' | 'bn';
  onLanguageChange: (language: 'ru' | 'en' | 'bn') => void;
  className?: string;
  allowedLanguages?: ('ru' | 'en' | 'bn')[];
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({
  language,
  onLanguageChange,
  className,
  allowedLanguages = ['ru', 'en', 'bn']
}) => {
  const handleLanguageSelect = (selectedLanguage: 'ru' | 'en' | 'bn') => {
    if (selectedLanguage !== language) {
      console.log(`Language changed from ${language} to ${selectedLanguage}`);
      onLanguageChange(selectedLanguage);
    }
  };

  const languageButtons = [
    { code: 'ru' as const, label: 'RU', name: 'Русский' },
    { code: 'en' as const, label: 'EN', name: 'English' },
    { code: 'bn' as const, label: 'BN', name: 'বাংলা' }
  ].filter(lang => allowedLanguages.includes(lang.code));

  // Hide toggle if only one language is available
  if (languageButtons.length < 2) return null;

  return (
    <div className={cn("flex items-center bg-muted/50 rounded-lg p-1", className)}>
      <div className="flex items-center gap-1">
        <Globe className="h-3 w-3 text-muted-foreground" />
        {languageButtons.map(({ code, label }) => (
          <Button
            key={code}
            variant="ghost"
            size="sm"
            onClick={() => handleLanguageSelect(code)}
            disabled={language === code}
            className={cn(
              "h-8 px-3 text-xs font-medium transition-all",
              language === code 
                ? "bg-background text-foreground shadow-sm cursor-default" 
                : "text-muted-foreground hover:text-foreground cursor-pointer"
            )}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default LanguageToggle;