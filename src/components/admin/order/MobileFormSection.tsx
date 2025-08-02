
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileFormSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export const MobileFormSection: React.FC<MobileFormSectionProps> = ({
  title,
  children,
  defaultOpen = true,
  className = "",
  disabled = false,
  icon
}) => {
  const isMobile = useIsMobile();

  // Всегда показываем контент без сворачивания
  return (
    <Card className={`${className} ${disabled ? 'opacity-50' : ''}`}>
      <CardHeader className={isMobile ? 'pb-3' : ''}>
        <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} font-medium flex items-center gap-2`}>
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={`${isMobile ? 'pt-0 pb-4' : ''}`}>
        {disabled ? (
          <div className="p-4 text-center text-gray-500">
            <p>Please fill in required fields first</p>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
};
