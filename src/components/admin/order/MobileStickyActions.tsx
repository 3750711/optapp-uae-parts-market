
import React from 'react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileStickyActionsProps {
  primaryAction: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
}

export const MobileStickyActions: React.FC<MobileStickyActionsProps> = ({
  primaryAction,
  secondaryAction
}) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <div className="flex justify-end gap-4 pt-6 border-t">
        {secondaryAction && (
          <Button
            variant="outline"
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled}
          >
            {secondaryAction.label}
          </Button>
        )}
        <Button
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          size="lg"
          className="min-w-[200px]"
        >
          {primaryAction.loading ? 'Загрузка...' : primaryAction.label}
        </Button>
      </div>
    );
  }

  return (
    <div className="mobile-sticky-bottom bg-white border-t border-gray-200 p-4 space-y-3">
      <Button
        onClick={primaryAction.onClick}
        disabled={primaryAction.disabled}
        size="lg"
        className="w-full touch-target min-h-[48px] text-base font-medium"
        >
          {primaryAction.loading ? 'Загрузка...' : primaryAction.label}
        </Button>
      {secondaryAction && (
        <Button
          variant="outline"
          onClick={secondaryAction.onClick}
          disabled={secondaryAction.disabled}
          size="lg"
          className="w-full touch-target min-h-[48px] text-base"
        >
          {secondaryAction.label}
        </Button>
      )}
    </div>
  );
};
