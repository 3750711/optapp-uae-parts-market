import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  Users, 
  TrendingUp, 
  Download, 
  Calendar,
  BarChart3,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  usePageViewStats,
  usePageViewsByHour,
  usePageViewsByDay,
  usePageViewsFiltered,
  usePageViewUsers,
} from '@/hooks/usePageViewLogs';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { exportPageViewsToCSV, exportPageViewsToJSON } from '@/utils/activityExport';

export const PageViewsTab = () => {
  const [periodDays, setPeriodDays] = useState<number>(7);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [pathSearch, setPathSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const { data: stats } = usePageViewStats(periodDays);
  const { data: hourlyData } = usePageViewsByHour();
  const { data: dailyData } = usePageViewsByDay();
  const { data: pageViews, isLoading } = usePageViewsFiltered(periodDays, selectedUser, pathSearch);
  const { data: users } = usePageViewUsers();

  // Pagination
  const paginatedData = useMemo(() => {
    if (!pageViews) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return pageViews.slice(startIndex, startIndex + itemsPerPage);
  }, [pageViews, currentPage]);

  const totalPages = Math.ceil((pageViews?.length || 0) / itemsPerPage);

  // Export handlers
  const handleExportCSV = () => {
    if (!pageViews) return;
    const exportData = pageViews.map(pv => ({
      created_at: pv.created_at,
      user_name: pv.profiles?.full_name || 'Гость',
      user_email: pv.profiles?.email || '-',
      path: pv.path || '-',
      referrer: pv.details?.metadata?.referrer || '-',
      user_agent: pv.user_agent || '-',
    }));
    exportPageViewsToCSV(exportData);
  };

  const handleExportJSON = () => {
    if (!pageViews) return;
    const exportData = pageViews.map(pv => ({
      created_at: pv.created_at,
      user_name: pv.profiles?.full_name || 'Гость',
      user_email: pv.profiles?.email || '-',
      path: pv.path || '-',
      referrer: pv.details?.metadata?.referrer || '-',
      user_agent: pv.user_agent || '-',
    }));
    exportPageViewsToJSON(exportData);
  };

  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'dd MMM yyyy, HH:mm:ss', { locale: ru });
    } catch {
      return timestamp;
    }
  };

  const getReferrer = (details: any) => {
    try {
      if (details?.metadata?.referrer) {
        return details.metadata.referrer;
      }
      return '-';
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Просмотров сегодня</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats && periodDays === 1 ? stats.total_views : '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">За {periodDays} дней</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_views.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Уникальных пользователей</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.unique_users || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Среднее на пользователя</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.avg_per_user.toFixed(1) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="hourly" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hourly">
            <Activity className="mr-2 h-4 w-4" />
            По часам (24ч)
          </TabsTrigger>
          <TabsTrigger value="daily">
            <BarChart3 className="mr-2 h-4 w-4" />
            По дням (7 дней)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hourly">
          <Card>
            <CardHeader>
              <CardTitle>Просмотры по часам</CardTitle>
              <CardDescription>Последние 24 часа</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Просмотры"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Просмотры по дням</CardTitle>
              <CardDescription>Последние 7 дней</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="views" fill="hsl(var(--primary))" name="Просмотры" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={String(periodDays)} onValueChange={(v) => setPeriodDays(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Период" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Сегодня</SelectItem>
                <SelectItem value="7">7 дней</SelectItem>
                <SelectItem value="30">30 дней</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Пользователь" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все пользователи</SelectItem>
                {users?.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Поиск по пути..."
              value={pathSearch}
              onChange={(e) => setPathSearch(e.target.value)}
            />

            <div className="flex gap-2">
              <Button onClick={handleExportCSV} variant="outline" size="sm" className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button onClick={handleExportJSON} variant="outline" size="sm" className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Детальный лог просмотров</CardTitle>
          <CardDescription>
            Показано {paginatedData.length} из {pageViews?.length || 0} записей
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
          ) : !pageViews || pageViews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Нет данных</div>
          ) : (
            <>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Время</TableHead>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Путь</TableHead>
                      <TableHead>Referrer</TableHead>
                      <TableHead>Браузер</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((pv) => (
                      <TableRow key={pv.id}>
                        <TableCell className="font-mono text-xs">
                          {formatTime(pv.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {pv.profiles?.full_name || 'Гость'}
                            {pv.profiles?.user_type && (
                              <Badge variant="outline" className="text-xs">
                                {pv.profiles.user_type}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {pv.profiles?.email || '-'}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {pv.path || '-'}
                          </code>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {getReferrer(pv.details)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                          {pv.user_agent || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Страница {currentPage} из {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Назад
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Вперёд
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
