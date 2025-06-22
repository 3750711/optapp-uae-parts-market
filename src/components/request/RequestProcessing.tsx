
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RequestProcessingProps {
  requestId: string;
  onStatusChange?: (status: string) => void;
}

type ProcessingStatus = 'pending' | 'processing' | 'matched' | 'fulfilled' | 'cancelled';

export const RequestProcessing: React.FC<RequestProcessingProps> = ({
  requestId,
  onStatusChange
}) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<ProcessingStatus>('pending');
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Загружаем текущий статус запроса
    loadRequestStatus();
  }, [requestId]);

  const loadRequestStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('status, processing_progress')
        .eq('id', requestId)
        .single();

      if (error) throw error;

      if (data) {
        setStatus(data.status as ProcessingStatus);
        setProgress(data.processing_progress || 0);
      }
    } catch (error) {
      console.error('Error loading request status:', error);
    }
  };

  const updateStatus = async (newStatus: ProcessingStatus, newProgress: number = 0) => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ 
          status: newStatus, 
          processing_progress: newProgress,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      setStatus(newStatus);
      setProgress(newProgress);

      if (onStatusChange) {
        onStatusChange(newStatus);
      }

      toast({
        title: "Статус обновлен",
        description: `Запрос переведен в статус: ${getStatusLabel(newStatus)}`,
      });
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить статус",
        variant: "destructive"
      });
    }
  };

  const startProcessing = async () => {
    setIsProcessing(true);
    await updateStatus('processing', 25);
    
    // Имитация этапов обработки
    setTimeout(async () => {
      await updateStatus('processing', 50);
      setTimeout(async () => {
        await updateStatus('processing', 75);
        setTimeout(async () => {
          await updateStatus('matched', 100);
          setIsProcessing(false);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const getStatusLabel = (status: ProcessingStatus): string => {
    switch (status) {
      case 'pending': return 'Ожидает обработки';
      case 'processing': return 'Обрабатывается';
      case 'matched': return 'Найдены совпадения';
      case 'fulfilled': return 'Выполнен';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'matched':
      case 'fulfilled':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: ProcessingStatus): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'matched': return 'bg-green-100 text-green-800';
      case 'fulfilled': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            Обработка запроса
          </div>
          <Badge className={getStatusColor(status)}>
            {getStatusLabel(status)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'processing' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Прогресс обработки</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Создан</span>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <div className="flex items-center justify-between">
            <span>Ожидает обработки</span>
            {status !== 'pending' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <Clock className="h-4 w-4 text-yellow-600" />
            )}
          </div>
          <div className="flex items-center justify-between">
            <span>Обрабатывается</span>
            {['processing', 'matched', 'fulfilled'].includes(status) ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <Clock className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <div className="flex items-center justify-between">
            <span>Найдены совпадения</span>
            {['matched', 'fulfilled'].includes(status) ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <Clock className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>

        {status === 'pending' && (
          <Button 
            onClick={startProcessing}
            disabled={isProcessing || !user}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Обработка...
              </>
            ) : (
              'Начать обработку'
            )}
          </Button>
        )}

        {status === 'matched' && (
          <div className="space-y-2">
            <Button 
              onClick={() => updateStatus('fulfilled')}
              className="w-full"
              variant="default"
            >
              Отметить как выполненный
            </Button>
            <Button 
              onClick={() => updateStatus('cancelled')}
              className="w-full"
              variant="destructive"
            >
              Отменить запрос
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RequestProcessing;
