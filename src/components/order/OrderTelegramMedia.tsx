import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Медиа из Telegram</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Медиа из Telegram</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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