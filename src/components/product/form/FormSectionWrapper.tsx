
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
});

FormSectionWrapper.displayName = "FormSectionWrapper";

export default FormSectionWrapper;
