import React from 'react';
import { AlertTriangle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CONTACT_CONFIG } from '@/config/contact';

interface ContactErrorFallbackProps {
  errors: string[];
  onManagerContact: () => void;
  onRetry?: () => void;
  showRetry?: boolean;
}

export const ContactErrorFallback: React.FC<ContactErrorFallbackProps> = ({
  errors,
  onManagerContact,
  onRetry,
  showRetry = false,
}) => {
  return (
    <div className="border border-orange-200 bg-orange-50 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-orange-600" />
        <h4 className="font-medium text-orange-900">
          Проблема с контактной информацией
        </h4>
      </div>
      
      <div className="space-y-2">
        {errors.map((error, index) => (
          <p key={index} className="text-sm text-orange-800">
            • {error}
          </p>
        ))}
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-orange-800">
          Наш менеджер поможет связаться с продавцом:
        </p>
        
        <div className="flex gap-2">
          <Button
            onClick={onManagerContact}
            variant="default"
            size="sm"
            className="flex-1"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Связаться с менеджером
          </Button>
          
          {showRetry && onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
            >
              Попробовать еще раз
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};