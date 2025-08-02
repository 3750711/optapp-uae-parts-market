import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface OptIdAnimationProps {
  optId: string;
  onComplete: () => void;
  translations: any;
}

export const OptIdAnimation: React.FC<OptIdAnimationProps> = ({ 
  optId, 
  onComplete, 
  translations 
}) => {
  const [showOptId, setShowOptId] = useState(false);
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Animate dots
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    // Show OPT ID after 5 seconds
    const timer = setTimeout(() => {
      setShowOptId(true);
      clearInterval(dotsInterval);
      // Auto proceed after showing OPT ID for 3 seconds
      setTimeout(onComplete, 3000);
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(dotsInterval);
    };
  }, [onComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-8 text-center space-y-6">
          {!showOptId ? (
            <>
              <div className="w-16 h-16 mx-auto mb-6">
                <div className="w-full h-full border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                {translations.generatingOptId}{dots}
              </h2>
              <div className="space-y-2">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-primary-glow animate-pulse rounded-full transition-all duration-1000"></div>
                </div>
              </div>
            </>
          ) : (
            <div className="animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-primary to-primary-glow rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {translations.optIdGenerated}
              </h2>
              
              <div className="bg-gradient-to-r from-primary/10 to-primary-glow/10 border border-primary/20 rounded-lg p-4 mb-4">
                <div className="text-sm text-muted-foreground mb-2">OPT_ID:</div>
                <div className="text-2xl font-mono font-bold text-primary bg-background/50 rounded px-3 py-2">
                  {optId}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {translations.optIdNote}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};