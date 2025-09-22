import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  TrendingUp, 
  Users, 
  Activity, 
  Brain, 
  BarChart3,
  Filter,
  Download,
  Loader2
} from 'lucide-react';

interface SearchAnalytic {
  id: string;
  query: string;
  results_count: number;
  threshold: number;
  filters: any;
  created_at: string;
  user_id?: string;
}

interface SearchStats {
  totalSearches: number;
  avgResultsCount: number;
  topQueries: Array<{ query: string; count: number }>;
  searchesByDay: Array<{ date: string; count: number }>;
  avgThreshold: number;
}

const AdminSearchAnalytics: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<SearchAnalytic[]>([]);
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [dateRange, setDateRange] = useState('7'); // days

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - parseInt(dateRange));
      
      // Fetch search analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('search_analytics')
        .select('*')
        .gte('created_at', dateFrom.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (analyticsError) {
        throw analyticsError;
      }

      setAnalytics(analyticsData || []);
      
      // Calculate stats
      if (analyticsData?.length) {
        const totalSearches = analyticsData.length;
        const avgResultsCount = analyticsData.reduce((sum, item) => sum + item.results_count, 0) / totalSearches;
        const avgThreshold = analyticsData.reduce((sum, item) => sum + item.threshold, 0) / totalSearches;
        
        // Top queries
        const queryCount: Record<string, number> = {};
        analyticsData.forEach(item => {
          queryCount[item.query] = (queryCount[item.query] || 0) + 1;
        });
        
        const topQueries = Object.entries(queryCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([query, count]) => ({ query, count }));

        // Searches by day
        const searchesByDay: Record<string, number> = {};
        analyticsData.forEach(item => {
          const date = new Date(item.created_at).toISOString().split('T')[0];
          searchesByDay[date] = (searchesByDay[date] || 0) + 1;
        });

        const searchesByDayArray = Object.entries(searchesByDay)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));

        setStats({
          totalSearches,
          avgResultsCount: Math.round(avgResultsCount * 100) / 100,
          avgThreshold: Math.round(avgThreshold * 100) / 100,
          topQueries,
          searchesByDay: searchesByDayArray,
        });
      } else {
        setStats({
          totalSearches: 0,
          avgResultsCount: 0,
          avgThreshold: 0,
          topQueries: [],
          searchesByDay: [],
        });
      }

    } catch (error) {
      console.error('Error fetching search analytics:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить аналитику поиска",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAnalytics = analytics.filter(item =>
    searchFilter === '' || 
    item.query.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const exportData = () => {
    const csvContent = [
      ['Запрос', 'Результатов', 'Точность', 'Дата'].join(','),
      ...filteredAnalytics.map(item => [
        `"${item.query}"`,
        item.results_count,
        item.threshold,
        new Date(item.created_at).toLocaleString('ru-RU')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `search_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <>
      <Helmet>
        <title>Аналитика поиска - PartsBay Admin</title>
        <meta name="description" content="Аналитика семантического поиска с ИИ" />
      </Helmet>

      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4 flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              Аналитика ИИ Поиска
            </h1>
            <p className="text-muted-foreground">
              Статистика и аналитика семантического поиска автозапчастей
            </p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Всего поисков</p>
                      <p className="text-2xl font-bold">{stats.totalSearches}</p>
                    </div>
                    <Search className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Среднее результатов</p>
                      <p className="text-2xl font-bold">{stats.avgResultsCount}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Средняя точность</p>
                      <p className="text-2xl font-bold">{(stats.avgThreshold * 100).toFixed(0)}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">За {dateRange} дней</p>
                      <p className="text-2xl font-bold">{stats.searchesByDay.reduce((sum, day) => sum + day.count, 0)}</p>
                    </div>
                    <Activity className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Поиск по запросам..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="1">За день</option>
                <option value="7">За неделю</option>
                <option value="30">За месяц</option>
                <option value="90">За 3 месяца</option>
              </select>
              <Button onClick={exportData} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Экспорт
              </Button>
            </div>
          </div>

          {/* Top Queries */}
          {stats?.topQueries && stats.topQueries.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Популярные запросы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.topQueries.map(({ query, count }, index) => (
                    <div key={query} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{index + 1}</Badge>
                        <span className="font-medium">{query}</span>
                      </div>
                      <Badge>{count} раз</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                История поисков
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredAnalytics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Поисковые запросы не найдены</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAnalytics.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg">"{item.query}"</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>Результатов: {item.results_count}</span>
                            <span>Точность: {(item.threshold * 100).toFixed(0)}%</span>
                            <span>{new Date(item.created_at).toLocaleString('ru-RU')}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={item.results_count > 0 ? "default" : "destructive"}>
                            {item.results_count > 0 ? "Найдено" : "Не найдено"}
                          </Badge>
                        </div>
                      </div>
                      
                      {Object.keys(item.filters).length > 0 && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                          <span className="font-medium">Фильтры: </span>
                          {JSON.stringify(item.filters, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminSearchAnalytics;