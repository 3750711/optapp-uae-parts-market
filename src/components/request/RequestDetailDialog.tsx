
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Tag, Vin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import RequestProcessing from '@/components/request/RequestProcessing';

interface RequestDetailDialogProps {
  requestId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isNewRequest?: boolean;
}

const RequestDetailDialog: React.FC<RequestDetailDialogProps> = ({
  requestId,
  open,
  onOpenChange,
  isNewRequest = false,
}) => {
  const { data: request, isLoading } = useQuery({
    queryKey: ['request', requestId],
    queryFn: async () => {
      if (!requestId) return null;
      
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!requestId && open
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'processing': return 'secondary';
      case 'completed': return 'success';
      default: return 'outline';
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {isLoading ? (
          <>
            <DialogHeader>
              <Skeleton className="h-8 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </DialogHeader>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </>
        ) : !request ? (
          <DialogHeader>
            <DialogTitle>Запрос не найден</DialogTitle>
            <p className="text-muted-foreground">
              Запрашиваемая информация не существует или была удалена
            </p>
          </DialogHeader>
        ) : isNewRequest ? (
          <RequestProcessing requestId={requestId} requestTitle={request.title} />
        ) : (
          <>
            <DialogHeader>
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="text-2xl mb-2">{request.title}</DialogTitle>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarClock className="w-4 h-4 mr-2" />
                    {new Date(request.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>
                <Badge variant={getStatusBadgeVariant(request.status)}>
                  {request.status === 'pending' && 'В ожидании'}
                  {request.status === 'processing' && 'В обработке'}
                  {request.status === 'completed' && 'Завершен'}
                </Badge>
              </div>
            </DialogHeader>
            
            <div className="space-y-4">
              {(request.brand || request.model) && (
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4" />
                  <span className="font-medium">
                    {request.brand} {request.model && `${request.model}`}
                  </span>
                </div>
              )}
              
              {request.vin && (
                <div className="flex items-center gap-2 text-sm">
                  <Vin className="h-4 w-4" />
                  <span className="font-medium">VIN: {request.vin}</span>
                </div>
              )}
              
              {request.description && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-1">Дополнительная информация:</h3>
                  <div className="text-sm whitespace-pre-wrap">{request.description}</div>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RequestDetailDialog;
