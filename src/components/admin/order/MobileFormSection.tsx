
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  if (!isMobile) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} shadow-sm`}>
      <Collapsible open={isOpen && !disabled} onOpenChange={disabled ? undefined : setIsOpen}>
        <CollapsibleTrigger asChild disabled={disabled}>
          <CardHeader className={`pb-3 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer active:bg-gray-50'} transition-colors touch-target`}>
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                {icon}
                {title}
              </CardTitle>
              {!disabled && (
                <>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </>
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
