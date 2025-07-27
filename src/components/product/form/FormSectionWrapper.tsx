
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface FormSectionWrapperProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const FormSectionWrapper = React.memo<FormSectionWrapperProps>(({ 
  title, 
  children, 
  className = "" 
}) => {
  const isMobile = useIsMobile();
  
  return (
    <Card className={cn(
      "transition-all duration-200",
      isMobile ? "mobile-section shadow-sm border-border/50 rounded-xl" : "",
      className
    )}>
      <CardHeader className={cn(
        isMobile ? "pb-3" : "pb-6"
      )}>
        <CardTitle className={cn(
          isMobile ? "text-base font-semibold" : "text-lg"
        )}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(
        isMobile ? "pt-0 space-y-4" : "space-y-6"
      )}>
        {children}
      </CardContent>
    </Card>
  );
});

FormSectionWrapper.displayName = "FormSectionWrapper";

export default FormSectionWrapper;
