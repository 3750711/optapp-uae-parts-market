
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';

interface AdminFreeOrderFormActionsProps {
  formData: any;
  isLoading: boolean;
  canSubmit: boolean;
  onCreateOrderClick: () => void;
}

export const AdminFreeOrderFormActions: React.FC<AdminFreeOrderFormActionsProps> = ({
  formData,
  isLoading,
  canSubmit,
  onCreateOrderClick
}) => {
  const isMobile = useIsMobile();

  const validateAndProceed = () => {
    if (!formData.title || !formData.price || !formData.sellerId || !formData.buyerOptId) {
      toast({
        title: "Заполните обязательные поля",
        description: "Необходимо заполнить название, цену, продавца и OPT_ID покупателя",
        variant: "destructive",
      });
      return;
    }
    onCreateOrderClick();
  };

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        <Button
          type="button"
          onClick={validateAndProceed}
          disabled={isLoading || !canSubmit}
          size="lg"
          className="w-full touch-target min-h-[48px] text-base font-medium"
        >
          {isLoading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Создание заказа...
            </>
          ) : (
            'Создать заказ'
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex justify-end pt-6 border-t">
      <Button
        type="button"
        onClick={validateAndProceed}
        disabled={isLoading || !canSubmit}
        size="lg"
        className="min-w-[200px]"
      >
        <Plus className="mr-2 h-4 w-4" />
        Создать заказ
      </Button>
    </div>
  );
};
