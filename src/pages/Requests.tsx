
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, MessageSquare, Sparkles, Send, ShoppingBag, Clock, Award, Tag, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import RequestMatchCount from '@/components/request/RequestMatchCount';

interface Request {
  id: string;
  created_at: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed';
  user_id: string;
  user_name: string;
  brand?: string;
  model?: string;
  vin?: string;
}

const Requests: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  // State to track requests the user has marked as "Don't have"
  const [hiddenRequestIds, setHiddenRequestIds] = useState<string[]>([]);
  
  // Load hidden requests from local storage on component mount
  useEffect(() => {
    const storedHiddenRequests = localStorage.getItem('hiddenRequests');
    if (storedHiddenRequests) {
      setHiddenRequestIds(JSON.parse(storedHiddenRequests));
    }
  }, []);
  
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

  // Handler for "У меня есть" button
  const handleIHave = (requestId: string) => {
    navigate(`/requests/${requestId}`);
  };
  
  // Handler for "Нету" button
  const handleDontHave = (requestId: string) => {
    // Add the request ID to the list of hidden requests
    const updatedHiddenRequests = [...hiddenRequestIds, requestId];
    setHiddenRequestIds(updatedHiddenRequests);
    
    // Store the updated hidden requests in local storage
    localStorage.setItem('hiddenRequests', JSON.stringify(updatedHiddenRequests));
  };

  // Filter out hidden requests from the displayed list
  const visibleRequests = requests?.filter(request => !hiddenRequestIds.includes(request.id));

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'secondary';
      case 'completed': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced header removed */}
        
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
        ) : !visibleRequests || visibleRequests.length === 0 ? (
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
            {visibleRequests.map((request) => (
              <Card 
                key={request.id} 
                className="overflow-hidden h-full flex flex-col border group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 animate-fade-in cursor-pointer"
                onClick={(e) => {
                  // Prevent navigation when clicking on the card if the click target is not a button
                  e.stopPropagation();
                }}
              >
                <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                <CardHeader>
                  <CardTitle className="line-clamp-1">
                    {request.title}
                  </CardTitle>
                  <div className="flex justify-between items-center">
                    <Badge variant={getStatusBadgeVariant(request.status)}>
                      {request.status === 'pending' && 'В работе'}
                      {request.status === 'processing' && 'В работе'}
                      {request.status === 'completed' && 'Выполнен'}
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <CalendarClock className="w-3 h-3 mr-1" />
                      {new Date(request.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  {(request.brand || request.model) && (
                    <div className="flex items-center gap-1.5 mb-2 text-sm text-muted-foreground">
                      <Tag className="h-3.5 w-3.5" />
                      <span>
                        {request.brand || ""} {request.model ? request.model : ""}
                      </span>
                    </div>
                  )}
                  
                  <CardDescription className="line-clamp-3 mb-2">
                    {request.description}
                  </CardDescription>
                  
                  {/* Display count of matching products */}
                  <div className="mt-2">
                    <RequestMatchCount 
                      requestTitle={request.title} 
                      requestBrand={request.brand} 
                      requestModel={request.model} 
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-2 flex-col sm:flex-row">
                  <Button 
                    variant="outline" 
                    className="flex-1 border-green-500 hover:bg-green-500 hover:text-white transition-all"
                    onClick={() => handleIHave(request.id)}
                  >
                    <Check className="mr-1 h-4 w-4" />
                    У меня есть
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 border-red-500 hover:bg-red-500 hover:text-white transition-all"
                    onClick={() => handleDontHave(request.id)}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Нету
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        
        {/* Benefits banner */}
        {visibleRequests && visibleRequests.length > 0 && (
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
