import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfileAccessStats } from '@/hooks/useProfileAccessStats';
import { format } from 'date-fns';
import { CalendarIcon, EyeIcon, UserIcon, ClockIcon } from 'lucide-react';

const ProfileAccessStats: React.FC = () => {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
  );
  const [endDate, setEndDate] = useState(new Date());

  const { data, isLoading, error, refetch, isAdmin } = useProfileAccessStats({
    startDate,
    endDate,
  });

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Доступ запрещен. Только администраторы могут просматривать статистику доступа к профилям.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-destructive">
            Ошибка загрузки статистики: {error.message}
          </p>
          <Button onClick={() => refetch()} className="mt-4 mx-auto block">
            Повторить
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EyeIcon className="h-5 w-5" />
            Статистика доступа к профилям
          </CardTitle>
          <CardDescription>
            Мониторинг доступа пользователей к профилям других пользователей
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="start-date">Дата начала</Label>
              <Input
                id="start-date"
                type="date"
                value={format(startDate, 'yyyy-MM-dd')}
                onChange={(e) => setStartDate(new Date(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Дата окончания</Label>
              <Input
                id="end-date"
                type="date"
                value={format(endDate, 'yyyy-MM-dd')}
                onChange={(e) => setEndDate(new Date(e.target.value))}
              />
            </div>
          </div>
          
          <Button onClick={() => refetch()} disabled={isLoading}>
            {isLoading ? 'Обновление...' : 'Обновить статистику'}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Загрузка статистики...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {data.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Нет данных о доступе к профилям за выбранный период
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{data.length}</p>
                        <p className="text-xs text-muted-foreground">
                          Профилей просмотрено
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <EyeIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">
                          {data.reduce((sum, item) => sum + item.access_count, 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Всего обращений
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">
                          {data.reduce((sum, item) => sum + item.accessor_count, 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Уникальных пользователей
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Детальная статистика по профилям</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.map((item) => (
                      <div
                        key={item.accessed_profile_id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {item.accessed_profile_name || 'Неизвестный пользователь'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            ID: {item.accessed_profile_id}
                          </p>
                        </div>
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="flex items-center space-x-1">
                            <UserIcon className="h-4 w-4" />
                            <span>{item.accessor_count} польз.</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <EyeIcon className="h-4 w-4" />
                            <span>{item.access_count} просм.</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="h-4 w-4" />
                            <span>
                              {format(new Date(item.last_access), 'dd.MM.yyyy HH:mm')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileAccessStats;