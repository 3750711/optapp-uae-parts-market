import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface LoadingAnimationProps {
  translations: any;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ translations }) => {
  const [step, setStep] = useState(0);
  const [dots, setDots] = useState('');

  const steps = [
    translations.creatingAccount,
    translations.waitingVerification
  ];

  useEffect(() => {
    // Animate dots
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    // Progress through steps
    const stepTimer = setTimeout(() => {
      if (step < steps.length - 1) {
        setStep(step + 1);
      }
    }, 3000);

    return () => {
      clearInterval(dotsInterval);
      clearTimeout(stepTimer);
    };
  }, [step, steps.length]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-8 text-center space-y-6">
          {step === 0 ? (
            <>
              <div className="w-16 h-16 mx-auto mb-6">
                <div className="w-full h-full border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                {steps[0]}{dots}
              </h2>
              <div className="space-y-2">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-primary-glow w-3/4 animate-pulse rounded-full transition-all duration-1000"></div>
                </div>
              </div>
            </>
          ) : (
            <div className="animate-fade-in space-y-6">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-foreground">
                {steps[1]}
              </h2>
              
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
                  {translations.verificationNote}
                </p>
              </div>
              
              <div className="flex justify-center space-x-1">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-2 h-2 bg-primary rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};