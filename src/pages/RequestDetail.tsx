
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Tag, FileText, Check, MessageSquare, Send, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import RequestProcessing from '@/components/request/RequestProcessing';

const RequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showResponseOptions, setShowResponseOptions] = useState(false);
  
  const { data: request, isLoading } = useQuery({
    queryKey: ['request', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      setDataLoaded(true);
      
      // After data is loaded, show response options after a delay
      setTimeout(() => {
        setShowResponseOptions(true);
      }, 2000);
      
      return data;
    },
    enabled: !!id
  });
  
  if (isLoading || !dataLoaded) {
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
        <div className="space-y-8">
          {/* Always show the request processing component */}
          <RequestProcessing requestId={id || ''} requestTitle={request.title} />
          
          {showResponseOptions && (
            <Card className="border shadow-lg animate-fade-in overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400"></div>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl flex items-center">
                  <Sparkles className="mr-3 h-5 w-5 text-amber-500" />
                  Предложения по запросу
                </CardTitle>
                <CardDescription>
                  Мы находим для вас лучшие предложения по запрошенной запчасти
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed">
                  <p className="text-muted-foreground">
                    Ожидайте предложения от продавцов в ближайшее время
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Original request details card */}
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
                <Badge variant={
                  request.status === 'processing' ? 'secondary' : 
                  request.status === 'completed' ? 'success' : 'secondary'
                }>
                  {request.status === 'pending' && 'В работе'}
                  {request.status === 'processing' && 'В работе'}
                  {request.status === 'completed' && 'Выполнен'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {(request.brand || request.model) && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span className="font-medium">
                    {request.brand} {request.model && `${request.model}`}
                  </span>
                </div>
              )}
              
              {request.vin && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">VIN: {request.vin}</span>
                </div>
              )}
              
              {request.description && (
                <div className="mt-4">
                  <h3 className="font-medium mb-1">Дополнительная информация:</h3>
                  <div className="whitespace-pre-wrap">{request.description}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default RequestDetail;
