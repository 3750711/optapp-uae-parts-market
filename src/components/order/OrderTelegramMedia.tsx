import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Camera, MessageSquare, AlertTriangle } from 'lucide-react';

interface OrderTelegramMediaProps {
  orderId: string;
}

interface OrderMedia {
  id: string;
  order_id: string;
  file_url: string;
  file_type: string;
  source: string;
  uploaded_by: number | null;
  created_at: string;
}

export const OrderTelegramMedia: React.FC<OrderTelegramMediaProps> = ({ orderId }) => {
  const queryClient = useQueryClient();
  
  const { data: mediaFiles, refetch, isLoading } = useQuery({
    queryKey: ['order_media', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_media')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as OrderMedia[];
    },
  });

  // Set up realtime updates for this order's media
  useEffect(() => {
    const channel = supabase
      .channel('order_media_changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'order_media', 
          filter: `order_id=eq.${orderId}` 
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, refetch]);

  const telegramBotUrl = `https://t.me/Optnewads_bot?start=order_${orderId}`;

  if (isLoading) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Telegram Photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Telegram Photos
        </CardTitle>
        <Button 
          onClick={() => {
            queryClient.invalidateQueries({ 
              queryKey: ['order-media', orderId] 
            });
          }}
          variant="outline" 
          size="sm"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Как загрузить фотографии через Telegram:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Нажмите кнопку "📷 Upload from Telegram" ниже</li>
                <li><strong>Обязательно</strong> отправьте команду боту в <strong>личном чате</strong></li>
                <li>Затем отправляйте фотографии в тот же <strong>личный чат с ботом</strong></li>
                <li>Не отправляйте фотографии в групповые чаты!</li>
              </ol>
              <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-sm">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                <strong>Важно:</strong> Фотографии работают только в личных сообщениях с ботом, не в группах.
              </div>
            </div>
          </div>
        </div>

        <a 
          href={telegramBotUrl}
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Camera className="h-4 w-4" />
          📷 Upload from Telegram
        </a>

        {!mediaFiles || mediaFiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Фото из Telegram не найдены
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {mediaFiles.map((media) => (
              <div key={media.id} className="relative group">
                <img
                  src={media.file_url}
                  alt="Медиа из Telegram"
                  className="w-full h-24 object-cover rounded-md border"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                  <a
                    href={media.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white text-sm hover:underline"
                  >
                    Открыть
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};