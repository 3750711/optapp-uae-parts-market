
import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Package, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface OrderHistoryTabProps {
  orderId: string;
}

export const OrderHistoryTab: React.FC<OrderHistoryTabProps> = ({ orderId }) => {
  const { data: history, isLoading } = useQuery({
    queryKey: ['order-history', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_logs')
        .select('*')
        .eq('entity_id', orderId)
        .eq('entity_type', 'order')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!orderId
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">История изменений пока пуста</p>
        </CardContent>
      </Card>
    );
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return <Package className="h-4 w-4" />;
      case 'update':
        return <ArrowRight className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionText = (actionType: string, details: any) => {
    switch (actionType) {
      case 'create':
        return 'Заказ создан';
      case 'update':
        if (details?.old_status && details?.new_status) {
          return `Статус изменен: ${details.old_status} → ${details.new_status}`;
        }
        return 'Заказ обновлен';
      case 'delete':
        return 'Заказ удален';
      default:
        return actionType;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            История изменений ({history.length})
          </CardTitle>
        </CardHeader>
      </Card>

      {history.map((event, index) => (
        <Card key={event.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${getActionColor(event.action_type)}`}>
                {getActionIcon(event.action_type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={getActionColor(event.action_type)}>
                    {getActionText(event.action_type, event.details)}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {format(new Date(event.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </span>
                </div>
                
                {event.user_id && (
                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                    <User className="h-3 w-3" />
                    <span>Пользователь: {event.user_id}</span>
                  </div>
                )}

                {event.details && Object.keys(event.details).length > 0 && (
                  <div className="bg-gray-50 rounded p-3 text-xs">
                    <div className="font-medium text-gray-700 mb-1">Детали изменений:</div>
                    <pre className="text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(event.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
