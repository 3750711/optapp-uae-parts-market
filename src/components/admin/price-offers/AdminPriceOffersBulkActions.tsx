import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, X, Check, Clock } from "lucide-react";
import { useUpdatePriceOffer } from "@/hooks/use-price-offers";
import { toast } from "@/hooks/use-toast";

interface AdminPriceOffersBulkActionsProps {
  selectedOfferIds: string[];
  onClearSelection: () => void;
  onBulkUpdate: () => void;
}

export const AdminPriceOffersBulkActions: React.FC<AdminPriceOffersBulkActionsProps> = ({
  selectedOfferIds,
  onClearSelection,
  onBulkUpdate
}) => {
  const updateOffer = useUpdatePriceOffer();

  const handleBulkAction = async (action: 'cancel' | 'expire') => {
    try {
      const promises = selectedOfferIds.map(id =>
        updateOffer.mutateAsync({
          id,
          data: { 
            status: action === 'cancel' ? 'cancelled' : 'expired' 
          }
        })
      );

      await Promise.all(promises);
      
      toast({
        title: "Операция выполнена",
        description: `${selectedOfferIds.length} предложений обновлено`,
      });
      
      onBulkUpdate();
      onClearSelection();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить операцию",
        variant: "destructive",
      });
    }
  };

  if (selectedOfferIds.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{selectedOfferIds.length} выбрано</Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4 mr-1" />
          Очистить
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction('cancel')}
          disabled={updateOffer.isPending}
        >
          <X className="h-4 w-4 mr-1" />
          Отменить
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction('expire')}
          disabled={updateOffer.isPending}
        >
          <Clock className="h-4 w-4 mr-1" />
          Пометить истекшими
        </Button>
      </div>
    </div>
  );
};