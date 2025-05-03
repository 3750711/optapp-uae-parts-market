
import React from 'react';
import Layout from '@/components/layout/Layout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

interface Request {
  id: string;
  created_at: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed';
  user_id: string;
  user_name: string;
}

const Requests: React.FC = () => {
  const { profile } = useAuth();
  
  const { data: requests, isLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return (data || []) as Request[];
    },
    enabled: !!profile
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
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Запросы</h1>
          <Button asChild>
            <Link to="/requests/create">Создать запрос</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader>
                  <Skeleton className="h-6 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !requests || requests.length === 0 ? (
          <div className="text-center py-10">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <p className="text-xl text-muted-foreground">Пока нет запросов</p>
            <p className="text-muted-foreground mt-2">Создайте новый запрос, чтобы начать</p>
            <Button className="mt-4" asChild>
              <Link to="/requests/create">Создать запрос</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <Card key={request.id} className="overflow-hidden h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="line-clamp-1">
                    {request.title}
                  </CardTitle>
                  <div className="flex justify-between items-center">
                    <Badge variant={getStatusBadgeVariant(request.status)}>
                      {request.status === 'pending' && 'В ожидании'}
                      {request.status === 'processing' && 'В обработке'}
                      {request.status === 'completed' && 'Завершен'}
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <CalendarClock className="w-3 h-3 mr-1" />
                      {new Date(request.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardDescription className="line-clamp-3 mb-2">
                    {request.description}
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/requests/${request.id}`}>Подробнее</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Requests;
