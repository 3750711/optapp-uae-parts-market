import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Database, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const SessionsComputeButton: React.FC = () => {
  const [computing, setComputing] = useState(false);

  const handleCompute = async () => {
    setComputing(true);
    try {
      const { data, error } = await supabase.functions.invoke('compute-user-sessions', {
        body: {}
      });

      if (error) throw error;

      const result = data?.result;
      if (result) {
        toast.success('Сессии успешно вычислены!', {
          description: `Обработано событий: ${result.processedEvents || 0}, Создано сессий: ${result.sessionsCreated || 0}`
        });
      } else {
        toast.success('Вычисление сессий завершено');
      }
    } catch (error) {
      console.error('Failed to compute sessions:', error);
      toast.error('Ошибка при вычислении сессий', {
        description: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    } finally {
      setComputing(false);
    }
  };

  return (
    <Button
      onClick={handleCompute}
      disabled={computing}
      variant="outline"
      className="w-full"
    >
      {computing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Вычисление...
        </>
      ) : (
        <>
          <Database className="mr-2 h-4 w-4" />
          Вычислить сессии вручную
        </>
      )}
    </Button>
  );
};
