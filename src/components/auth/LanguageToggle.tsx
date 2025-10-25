import React from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

  const currentLanguage = languageButtons.find(lang => lang.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-3 text-xs font-medium transition-all flex items-center gap-1.5",
            className
          )}
        >
          <Globe className="h-3 w-3 text-muted-foreground" />
          <span>{currentLanguage?.label}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="min-w-[160px] bg-background/95 backdrop-blur-sm border shadow-lg"
      >
        {languageButtons.map(({ code, label, name }) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageSelect(code)}
            className={cn(
              "flex items-center justify-between cursor-pointer text-sm py-2",
              language === code && "bg-accent"
            )}
          >
            <span className="flex items-center gap-2">
              <span className="text-base">
                {code === 'ru' ? '🇷🇺' : code === 'en' ? '🇬🇧' : '🇧🇩'}
              </span>
              <span>{name}</span>
            </span>
            {language === code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageToggle;