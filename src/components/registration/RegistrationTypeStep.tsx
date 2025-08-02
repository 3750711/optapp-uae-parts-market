import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface RegistrationTypeStepProps {
  onSelectType: (type: 'telegram' | 'standard') => void;
  translations: any;
}

export const RegistrationTypeStep: React.FC<RegistrationTypeStepProps> = ({
  onSelectType,
  translations
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {translations.chooseRegistrationType}
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group"
              onClick={() => onSelectType('telegram')}>
          <CardContent className="p-6">
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="bg-gradient-to-r from-primary to-primary-glow text-white">
                {translations.recommended}
              </Badge>
            </div>
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.64 6.36c-.28 1.56-1.47 5.5-2.08 7.31-.25.77-.75 1.03-1.23.64-.5-.41-2.5-1.91-2.5-1.91s-.59-.41-.25-.97c.25-.41 2.06-2.06 2.06-2.06s.16-.34-.34-.06c-1.31.72-2.84 1.84-2.84 1.84s-.44.28-.97.03c-.53-.25-1.22-.47-1.22-.47s-.91-.56.63-.84c.63-.12 2.56-.97 5.37-2.06 1.97-.75 4-1.53 4-1.53s.75-.28.97.06c.09.16.19.53.06.97z"/>
                </svg>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {translations.telegramRegistration}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {translations.telegramSubtext}
                </p>
              </div>
            </div>
            
            <Button 
              className="w-full mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              onClick={(e) => {
                e.stopPropagation();
                onSelectType('telegram');
              }}
            >
              {translations.telegramRegistration}
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group"
              onClick={() => onSelectType('standard')}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-gradient-to-r from-secondary to-secondary/80 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {translations.standardRegistration}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {translations.standardSubtext}
                </p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={(e) => {
                e.stopPropagation();
                onSelectType('standard');
              }}
            >
              {translations.standardRegistration}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};