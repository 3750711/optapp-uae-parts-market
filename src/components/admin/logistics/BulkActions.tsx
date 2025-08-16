import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, X, Container, RotateCcw } from 'lucide-react';
import { OrderShipment } from '@/hooks/useOrderShipments';

interface BulkActionsProps {
  shipments: OrderShipment[];
  onBulkAction: (action: 'mark_all_shipped' | 'mark_all_not_shipped' | 'clear_all_containers' | 'reset_all') => void;
  disabled: boolean;
  hasChanges: boolean;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  shipments,
  onBulkAction,
  disabled,
  hasChanges
}) => {
  if (shipments.length === 0) return null;

  return (
    <Card className="border-dashed border-muted-foreground/30">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Массовые операции ({shipments.length} мест):
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction('mark_all_shipped')}
              disabled={disabled}
              className="h-8"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Отправить все
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction('mark_all_not_shipped')}
              disabled={disabled}
              className="h-8"
            >
              <X className="h-3 w-3 mr-1" />
              Сбросить статусы
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction('clear_all_containers')}
              disabled={disabled}
              className="h-8"
            >
              <Container className="h-3 w-3 mr-1" />
              Очистить контейнеры
            </Button>
            
            {hasChanges && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onBulkAction('reset_all')}
                disabled={disabled}
                className="h-8 text-orange-600 hover:text-orange-700"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Отменить изменения
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};