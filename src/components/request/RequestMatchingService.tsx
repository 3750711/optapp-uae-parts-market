
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RequestMatchingServiceProps {
  requestId: string;
  onMatchFound?: (matches: any[]) => void;
}

export const RequestMatchingService: React.FC<RequestMatchingServiceProps> = ({
  requestId,
  onMatchFound
}) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'found' | 'not-found'>('idle');

  const searchForMatches = async () => {
    if (!user || !profile) return;

    setIsSearching(true);
    setSearchStatus('searching');
    
    try {
      // Имитация поиска совпадений
      const { data: request, error: requestError } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      // Поиск подходящих товаров
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          seller:profiles!products_seller_id_fkey(
            id,
            full_name,
            opt_id,
            telegram,
            phone
          )
        `)
        .eq('status', 'active')
        .ilike('title', `%${request.title}%`);

      if (productsError) throw productsError;

      const foundMatches = products || [];
      setMatches(foundMatches);
      setSearchStatus(foundMatches.length > 0 ? 'found' : 'not-found');

      if (onMatchFound) {
        onMatchFound(foundMatches);
      }

      toast({
        title: foundMatches.length > 0 ? "Найдены совпадения!" : "Совпадения не найдены",
        description: foundMatches.length > 0 
          ? `Найдено ${foundMatches.length} подходящих товаров`
          : "Попробуйте изменить критерии поиска",
        variant: foundMatches.length > 0 ? "default" : "destructive"
      });

    } catch (error: any) {
      console.error('Error searching for matches:', error);
      toast({
        title: "Ошибка поиска",
        description: error.message || "Не удалось выполнить поиск",
        variant: "destructive"
      });
      setSearchStatus('idle');
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusIcon = () => {
    switch (searchStatus) {
      case 'searching':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'found':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'not-found':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (searchStatus) {
      case 'searching':
        return 'Поиск совпадений...';
      case 'found':
        return `Найдено ${matches.length} совпадений`;
      case 'not-found':
        return 'Совпадения не найдены';
      default:
        return 'Готов к поиску';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            Сервис поиска совпадений
          </div>
          <Badge variant={searchStatus === 'found' ? 'default' : 'secondary'}>
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Автоматический поиск товаров, соответствующих вашему запросу
        </p>

        <Button 
          onClick={searchForMatches}
          disabled={isSearching || !user}
          className="w-full"
        >
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Поиск...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Найти совпадения
            </>
          )}
        </Button>

        {matches.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Найденные товары:</h4>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {matches.slice(0, 5).map((product) => (
                <div key={product.id} className="p-2 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{product.title}</p>
                      <p className="text-xs text-gray-500">
                        {product.brand} - {product.price}$
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {product.seller?.opt_id}
                    </Badge>
                  </div>
                </div>
              ))}
              {matches.length > 5 && (
                <p className="text-xs text-gray-500 text-center">
                  И еще {matches.length - 5} товаров...
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RequestMatchingService;
