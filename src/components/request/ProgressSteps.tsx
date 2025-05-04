
import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProgressStepsProps {
  steps: {
    title: string;
    description: string;
  }[];
  stepDuration: number;
  onComplete: () => void;
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({ 
  steps, 
  stepDuration, 
  onComplete 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const totalSteps = steps.length;
    
    // Progress within a single step (0-100)
    const stepInterval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(stepInterval);
          return 100;
        }
        return prevProgress + 1;
      });
    }, stepDuration / 100);

    // Step advancement
    const advanceStep = setTimeout(() => {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(prev => prev + 1);
        setProgress(0);
      } else {
        setCompleted(true);
        onComplete();
      }
    }, stepDuration);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(advanceStep);
    };
  }, [currentStep, steps.length, stepDuration, onComplete]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="relative">
        <Progress value={progress} className="h-2" />
      </div>
      
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className={`flex items-start gap-3 ${
              index < currentStep ? 'text-muted-foreground' : 
              index === currentStep ? 'animate-pulse-soft' : 'opacity-50'
            }`}
          >
            <div className="mt-0.5">
              {index < currentStep ? (
                <CheckCircle className="h-5 w-5 text-primary" />
              ) : index === currentStep ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted" />
              )}
            </div>
            <div>
              <h4 className="text-base font-medium">{step.title}</h4>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
