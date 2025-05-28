
import React from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface MobileOptimizedFormProps {
  children: React.ReactNode;
  title: string;
  defaultOpen?: boolean;
  className?: string;
}

const MobileOptimizedForm: React.FC<MobileOptimizedFormProps> = ({
  children,
  title,
  defaultOpen = false,
  className = ""
}) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!isMobile) {
    // На десктопе показываем обычную карточку
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    );
  }

  // На мобильных используем коллапсибл
  return (
    <Card className={`${className} shadow-sm`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">{title}</CardTitle>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default MobileOptimizedForm;
