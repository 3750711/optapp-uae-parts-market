import React, { useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useUserActivity } from '@/hooks/useEventLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { groupEventsBySessions } from '@/utils/sessionGrouping';
import UserSessionCard from '@/components/user-activity/UserSessionCard';

const UserActivityPage: React.FC = () => {
  const { data, isLoading, error } = useUserActivity(500);

  // Группируем события по сессиям
  const sessions = useMemo(() => {
    if (!data) return [];
    return groupEventsBySessions(data);
  }, [data]);

  console.log('📊 [UserActivityPage] State:', { 
    hasData: !!data, 
    eventsCount: data?.length,
    sessionsCount: sessions.length,
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
            Найдено сессий: {sessions.length} • Всего событий: {data?.length || 0}
          </p>
        </div>

        {!sessions || sessions.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                Нет данных о активности пользователей
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sessions.map(session => (
              <UserSessionCard 
                key={session.sessionId || session.startTime} 
                session={session} 
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default UserActivityPage;
