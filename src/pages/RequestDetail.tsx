
import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const RequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  const { data: request, isLoading } = useQuery({
    queryKey: ['request', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'processing': return 'secondary';
      case 'completed': return 'success';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!request) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Запрос не найден</CardTitle>
              <CardDescription>Запрашиваемая информация не существует или была удалена</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl mb-2">{request.title}</CardTitle>
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
          </CardHeader>
          <CardContent className="space-y-4 whitespace-pre-wrap">
            {request.description}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default RequestDetail;
