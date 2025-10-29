import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Package, Container, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ShipmentHistoryDialogProps {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface HistoryEntry {
  id: string;
  changed_field: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
  changed_by: string | null;
  changer_name?: string;
}

const getFieldLabel = (field: string) => {
  switch (field) {
    case 'container_number':
      return 'Номер контейнера';
    case 'shipment_status':
      return 'Статус отгрузки';
    default:
      return field;
  }
};

const getStatusLabel = (status: string | null) => {
  if (!status) return 'Не указан';
  switch (status) {
    case 'not_shipped':
      return 'Не отправлен';
    case 'partially_shipped':
      return 'Частично отправлен';
    case 'in_transit':
      return 'Отправлен';
    default:
      return status;
  }
};

const getFieldIcon = (field: string) => {
  switch (field) {
    case 'container_number':
      return <Container className="h-4 w-4" />;
    case 'shipment_status':
      return <Package className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
};

export const ShipmentHistoryDialog: React.FC<ShipmentHistoryDialogProps> = ({
  orderId,
  open,
  onOpenChange,
}) => {
  const { data: history, isLoading } = useQuery({
    queryKey: ['shipment-history', orderId],
    queryFn: async () => {
      // First, get all shipment IDs for this order
      const { data: shipments, error: shipmentsError } = await supabase
        .from('order_shipments')
        .select('id')
        .eq('order_id', orderId);

      if (shipmentsError) throw shipmentsError;
      if (!shipments || shipments.length === 0) return [];

      const shipmentIds = shipments.map(s => s.id);

      // Get history for all shipments
      const { data: historyData, error: historyError } = await supabase
        .from('order_shipment_history')
        .select(`
          *,
          changer:changed_by (
            full_name
          )
        `)
        .in('order_shipment_id', shipmentIds)
        .order('changed_at', { ascending: false });

      if (historyError) throw historyError;

      return (historyData || []).map(entry => ({
        ...entry,
        changer_name: entry.changer?.full_name || 'Система'
      }));
    },
    enabled: open && !!orderId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>История изменений отгрузки</DialogTitle>
          <DialogDescription>
            Все изменения контейнеров и статусов отгрузки для этого заказа
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !history || history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            История изменений пока отсутствует
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {history.map((entry: HistoryEntry) => (
                <div
                  key={entry.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 text-primary">
                      {getFieldIcon(entry.changed_field)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {getFieldLabel(entry.changed_field)}
                        </span>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(entry.changed_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex-1 space-y-1">
                          <div className="text-muted-foreground">
                            Было: {' '}
                            <span className="text-foreground font-medium">
                              {entry.changed_field === 'shipment_status'
                                ? getStatusLabel(entry.old_value)
                                : entry.old_value || 'Не указано'}
                            </span>
                          </div>
                          <div className="text-muted-foreground">
                            Стало: {' '}
                            <span className="text-foreground font-medium">
                              {entry.changed_field === 'shipment_status'
                                ? getStatusLabel(entry.new_value)
                                : entry.new_value || 'Не указано'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {entry.changer_name}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
