
import React from 'react';
import Layout from '@/components/layout/Layout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, MessageSquare, Sparkles, Send, ShoppingBag, Clock, Award } from 'lucide-react';
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
        {/* Enhanced header with gradient background */}
        <div className="relative overflow-hidden rounded-xl mb-8 p-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Запросы на запчасти</h1>
              <div className="text-white/90 max-w-2xl space-y-3">
                <p className="text-xl font-medium leading-relaxed animate-fade-in" style={{animationDelay: '100ms'}}>
                  <span className="bg-gradient-to-r from-amber-200 to-yellow-100 bg-clip-text text-transparent font-semibold">Мгновенный доступ к сети из 100+ продавцов</span> — ваш запрос будет виден всем!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-full">
                      <Clock className="h-4 w-4 text-amber-200" />
                    </div>
                    <p className="text-sm">Предложения в течение минут</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-full">
                      <ShoppingBag className="h-4 w-4 text-amber-200" />
                    </div>
                    <p className="text-sm">Огромный выбор запчастей</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-full">
                      <Award className="h-4 w-4 text-amber-200" />
                    </div>
                    <p className="text-sm">Лучшие цены на partsbay.ae</p>
                  </div>
                </div>
              </div>
            </div>
            
            <Button size="lg" className="group relative overflow-hidden bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-lg" asChild>
              <Link to="/requests/create">
                <span className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 ease-out group-hover:w-full"></span>
                <Send className="mr-2 h-4 w-4" />
                Создать запрос
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
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
          <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed animate-fade-in">
            <div className="p-3 rounded-full bg-primary/10 mx-auto w-fit mb-5">
              <MessageSquare className="w-10 h-10 text-primary opacity-80" />
            </div>
            <h2 className="text-2xl font-bold mb-2">У вас пока нет запросов</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Создайте запрос на поиск запчасти, и более 100 продавцов получат его. 
              Вы получите предложения с лучшими ценами в кратчайшие сроки.
            </p>
            <Button size="lg" className="group relative overflow-hidden bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-lg" asChild>
              <Link to="/requests/create">
                <span className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 ease-out group-hover:w-full"></span>
                <Sparkles className="mr-2 h-4 w-4" />
                Создать первый запрос
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <Card key={request.id} className="overflow-hidden h-full flex flex-col border group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 animate-fade-in">
                <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
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
                  <Button variant="outline" className="w-full transition-all hover:bg-primary hover:text-primary-foreground" asChild>
                    <Link to={`/requests/${request.id}`}>Подробнее</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        
        {/* Benefits banner */}
        {requests && requests.length > 0 && (
          <div className="mt-8 p-6 rounded-xl border bg-gradient-to-r from-blue-50 to-purple-50 animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-amber-100">
                <Sparkles className="h-5 w-5 text-amber-500" />
              </div>
              <h3 className="font-bold text-lg">Нужна еще одна запчасть?</h3>
            </div>
            <p className="mb-4 text-gray-700">
              Создайте новый запрос и получите <span className="font-semibold text-amber-600">лучшие предложения от более чем 100 продавцов</span> и магазинов.
              Экономьте время и деньги с <span className="font-semibold">partsbay.ae</span> — самая большая база поставщиков запчастей в регионе!
            </p>
            <Button className="group relative overflow-hidden bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-lg" asChild>
              <Link to="/requests/create">
                <span className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 ease-out group-hover:w-full"></span>
                <Send className="mr-2 h-4 w-4" />
                Создать новый запрос
              </Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Requests;
