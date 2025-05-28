
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface OrderFormActionsProps {
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  isMobile?: boolean;
}

const OrderFormActions: React.FC<OrderFormActionsProps> = ({
  onSubmit,
  isSubmitting,
  canSubmit,
  isMobile = false
}) => {
  const navigate = useNavigate();

  if (isMobile) return null;

  return (
    <div className="flex justify-end space-x-4">
      <Button 
        variant="outline" 
        type="button"
        onClick={() => navigate(-1)}
        className="min-h-[44px]"
      >
        Отмена
      </Button>
      <Button 
        type="submit"
        className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500 min-h-[44px]"
        disabled={!canSubmit}
        onClick={onSubmit}
      >
        {isSubmitting ? "Создание..." : "Создать заказ"}
      </Button>
    </div>
  );
};

export default OrderFormActions;
