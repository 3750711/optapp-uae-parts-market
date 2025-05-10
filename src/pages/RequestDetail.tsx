
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CalendarClock, Tag, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import RequestProcessing from '@/components/request/RequestProcessing';
import RequestStatusBadge from '@/components/request/RequestStatusBadge';
import RequestMatchingService from '@/components/request/RequestMatchingService';

const RequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showResponseOptions, setShowResponseOptions] = useState(false);
  
  // Fetch request details
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
          
          {/* Add the real-time matching service if user allowed */}
          {showResponseOptions && (
            <RequestMatchingService 
              requestId={id || ''} 
              requestTitle={request.title}
              requestBrand={request.brand}
              requestModel={request.model}
            />
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
                <RequestStatusBadge status={request.status} />
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
