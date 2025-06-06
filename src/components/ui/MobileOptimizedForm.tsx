
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
  disabled?: boolean;
}

const MobileOptimizedForm: React.FC<MobileOptimizedFormProps> = ({
  children,
  title,
  defaultOpen = false,
  className = "",
  disabled = false
}) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!isMobile) {
    // На десктопе показываем обычную карточку
    return (
      <Card className={`${className} ${disabled ? 'opacity-50' : ''}`}>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {disabled ? (
            <div className="p-4 text-center text-gray-500">
              <p>Сначала загрузите фотографии товара</p>
            </div>
          ) : (
            children
          )}
        </CardContent>
      </Card>
    );
  }

  // На мобильных используем коллапсибл
  return (
    <Card className={`${className} shadow-sm ${disabled ? 'opacity-50' : ''}`}>
      <Collapsible open={isOpen && !disabled} onOpenChange={disabled ? undefined : setIsOpen}>
        <CollapsibleTrigger asChild disabled={disabled}>
          <CardHeader className={`pb-3 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'} transition-colors`}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">{title}</CardTitle>
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
          <CardContent className="pt-0">
            {disabled ? (
              <div className="p-4 text-center text-gray-500">
                <p>Сначала загрузите фотографии товара</p>
              </div>
            ) : (
              children
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default MobileOptimizedForm;
