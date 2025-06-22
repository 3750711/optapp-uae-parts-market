import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SimpleAuthContext';

interface RequestProcessingProps {
  requestId: string;
  requestTitle: string;
}

const RequestProcessing: React.FC<RequestProcessingProps> = ({ requestId, requestTitle }) => {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed'>('pending');

  // Fetch request status
  const { data: request, refetch } = useQuery({
    queryKey: ['request-status', requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requests')
        .select('status')
        .eq('id', requestId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!requestId,
    refetchInterval: 5000, // Check every 5 seconds
  });

  useEffect(() => {
    if (request?.status) {
      setStatus(request.status);
    }
  }, [request?.status]);

  useEffect(() => {
    // Check if request was just created
    const fromRequestCreate = sessionStorage.getItem('fromRequestCreate');
    const createdRequestId = sessionStorage.getItem('createdRequestId');

    if (fromRequestCreate === 'true' && createdRequestId === requestId) {
      setProcessing(true);
      sessionStorage.removeItem('fromRequestCreate');
      sessionStorage.removeItem('createdRequestId');
    }
  }, [requestId]);

  useEffect(() => {
    if (processing) {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        setProgress(currentProgress);

        if (currentProgress >= 100) {
          clearInterval(interval);
          setProcessing(false);
          toast({
            title: "Запрос обрабатывается",
            description: "Мы ищем лучшие предложения для вас",
          });
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, [processing]);

  const handleComplete = async () => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: 'completed' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Запрос завершен",
        description: "Вы успешно завершили обработку запроса",
      });
      refetch();
    } catch (error) {
      console.error("Error completing request:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось завершить запрос. Пожалуйста, попробуйте еще раз.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Обработка запроса</CardTitle>
      </CardHeader>
      <CardContent>
        {status === 'completed' ? (
          <Badge variant="success">Запрос выполнен</Badge>
        ) : processing ? (
          <>
            <p>Поиск предложений для "{requestTitle}"...</p>
            <Progress value={progress} />
          </>
        ) : (
          <>
            <p>Поиск предложений для "{requestTitle}"...</p>
            <Button onClick={handleComplete}>Завершить обработку</Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RequestProcessing;
