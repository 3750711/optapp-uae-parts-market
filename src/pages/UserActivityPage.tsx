import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useUserActivity } from '@/hooks/useEventLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

const UserActivityPage: React.FC = () => {
  const { data, isLoading, error } = useUserActivity(100);

  console.log('📊 [UserActivityPage] State:', { 
    hasData: !!data, 
    count: data?.length, 
    isLoading, 
    error 
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Загрузка данных...</span>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Card className="border-destructive">
          <CardContent className="py-8 text-center text-destructive">
            <p className="font-semibold">Ошибка загрузки данных</p>
            <p className="text-sm mt-2">{error.message}</p>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Активность пользователей</h1>
          <p className="text-muted-foreground mt-2">
            Всего событий: {data?.length || 0}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Последние события</CardTitle>
          </CardHeader>
          <CardContent>
            {!data || data.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Нет данных о активности
              </p>
            ) : (
              <div className="space-y-3">
                {data.slice(0, 20).map(event => (
                  <div key={event.id} className="p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">
                            {event.action_type}
                          </Badge>
                          {event.profiles?.full_name && (
                            <span className="text-sm font-medium">
                              {event.profiles.full_name}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {event.path || event.entity_type || 'Без пути'}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(event.created_at).toLocaleString('ru')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default UserActivityPage;
