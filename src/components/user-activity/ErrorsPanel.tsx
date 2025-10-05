import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle } from 'lucide-react';
import { ActivityEvent } from '@/hooks/user-activity/useActivityData';
import { getErrors } from '@/utils/user-activity/activityCalculations';
import { formatDateTime } from '@/utils/user-activity/activityFormatters';

interface ErrorsPanelProps {
  data: ActivityEvent[];
}

export const ErrorsPanel: React.FC<ErrorsPanelProps> = ({ data }) => {
  const errors = useMemo(() => getErrors(data).slice(0, 20), [data]);

  if (errors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Последние ошибки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Ошибок не обнаружено</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Последние ошибки ({errors.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {errors.map((error) => (
              <div 
                key={error.id} 
                className="p-4 border border-destructive/20 rounded-lg bg-destructive/5"
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="destructive">
                    {error.action_type === 'client_error' ? 'Ошибка клиента' : 'Ошибка API'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(error.created_at)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Пользователь:</span>{' '}
                    <span className="text-sm text-muted-foreground">
                      {error.profiles?.full_name || 'Аноним'}
                    </span>
                  </div>
                  
                  {error.path && (
                    <div>
                      <span className="text-sm font-medium">Путь:</span>{' '}
                      <span className="text-sm text-muted-foreground font-mono">
                        {error.path}
                      </span>
                    </div>
                  )}
                  
                  {error.details && (
                    <div>
                      <span className="text-sm font-medium">Детали:</span>
                      <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(error.details, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {error.ip_address && (
                    <div>
                      <span className="text-sm font-medium">IP:</span>{' '}
                      <span className="text-sm text-muted-foreground font-mono">
                        {error.ip_address}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
