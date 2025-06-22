import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Search, MessageCircle, Phone, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/SimpleAuthContext';

interface RequestMatchingServiceProps {
  requestId: string;
  requestTitle: string;
  requestBrand?: string;
  requestModel?: string;
}

const RequestMatchingService: React.FC<RequestMatchingServiceProps> = ({
  requestId,
  requestTitle,
  requestBrand,
  requestModel,
}) => {
  const { user } = useAuth();
  const [isMatching, setIsMatching] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRealTime, setIsRealTime] = useState(false);

  // Fetch initial matches
  const { data: initialMatches, isLoading: isLoadingInitialMatches } = useQuery(
    ['initialMatches', requestId],
    async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('title', `%${requestTitle}%`)
        .limit(5);

      if (error) {
        throw new Error(`Ошибка при поиске соответствий: ${error.message}`);
      }

      return data;
    },
    {
      enabled: !!requestId,
      retry: false,
    }
  );

  useEffect(() => {
    if (initialMatches) {
      setMatches(initialMatches);
    }
  }, [initialMatches]);

  // Real-time matching logic
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isRealTime) {
      timeoutId = setInterval(async () => {
        setIsMatching(true);
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .ilike('title', `%${requestTitle}%`)
            .limit(5);

          if (error) {
            throw new Error(`Ошибка при поиске соответствий: ${error.message}`);
          }

          setMatches(data || []);
          setLastUpdate(new Date());
          setError(null);
        } catch (err: any) {
          setError(err.message);
          toast({
            title: "Ошибка",
            description: "Не удалось обновить соответствия",
            variant: "destructive",
          });
        } finally {
          setIsMatching(false);
        }
      }, 10000);
    }

    return () => clearInterval(timeoutId);
  }, [isRealTime, requestTitle]);

  const toggleRealTime = () => {
    setIsRealTime((prev) => !prev);
  };

  const hasMatches = matches && matches.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Подходящие объявления
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleRealTime}
            disabled={isLoadingInitialMatches}
          >
            {isRealTime ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-pulse" />
                Обновление...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                {isLoadingInitialMatches ? 'Поиск...' : 'Включить поиск'}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
        {!hasMatches ? (
          <Alert>
            <AlertDescription>
              {isLoadingInitialMatches
                ? 'Загрузка...'
                : 'Соответствия не найдены. Попробуйте изменить запрос или включить автоматический поиск.'}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {matches.map((match: any) => (
              <div
                key={match.id}
                className="flex items-center justify-between p-2 border rounded-md"
              >
                <div>
                  <p className="font-medium">{match.title}</p>
                  <p className="text-sm text-muted-foreground">Цена: {match.price} AED</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Написать
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Phone className="w-4 h-4 mr-2" />
                    Позвонить
                  </Button>
                </div>
              </div>
            ))}
            {lastUpdate && (
              <p className="text-sm text-muted-foreground">
                Последнее обновление: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RequestMatchingService;
