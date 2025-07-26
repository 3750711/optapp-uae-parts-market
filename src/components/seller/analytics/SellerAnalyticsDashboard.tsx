import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { TrendingUp, TrendingDown, Eye, Users, Clock, Target } from "lucide-react";

interface SellerAnalyticsDashboardProps {
  productId: string;
  viewCount?: number;
  offersCount?: number;
  maxOfferPrice?: number | null;
}

// Mock data - в реальном приложении должно приходить с бэкенда
const viewsData = [
  { date: '01.12', views: 45 },
  { date: '02.12', views: 52 },
  { date: '03.12', views: 38 },
  { date: '04.12', views: 67 },
  { date: '05.12', views: 73 },
  { date: '06.12', views: 58 },
  { date: '07.12', views: 82 },
];

const offersData = [
  { price: '40000-45000', count: 3 },
  { price: '45000-50000', count: 7 },
  { price: '50000-55000', count: 4 },
  { price: '55000-60000', count: 2 },
];

const statusData = [
  { name: 'Ожидают', value: 8, color: '#f59e0b' },
  { name: 'Приняты', value: 3, color: '#10b981' },
  { name: 'Отклонены', value: 5, color: '#ef4444' },
];

const SellerAnalyticsDashboard: React.FC<SellerAnalyticsDashboardProps> = ({
  productId,
  viewCount = 0,
  offersCount = 0,
  maxOfferPrice
}) => {
  const conversionRate = offersCount > 0 ? ((offersCount / viewCount) * 100).toFixed(1) : '0';
  const avgDailyViews = (viewsData.reduce((acc, day) => acc + day.views, 0) / viewsData.length).toFixed(0);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Аналитика объявления
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="engagement">Активность</TabsTrigger>
            <TabsTrigger value="offers">Предложения</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Конверсия</span>
                </div>
                <div className="text-2xl font-bold">{conversionRate}%</div>
              </div>
              
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Ср. в день</span>
                </div>
                <div className="text-2xl font-bold">{avgDailyViews}</div>
              </div>
              
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">CTR</span>
                </div>
                <div className="text-2xl font-bold">
                  {offersCount > 0 ? (offersCount / viewCount * 100).toFixed(1) : '0'}%
                </div>
              </div>
              
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Интерес</span>
                </div>
                <Badge variant={offersCount > 5 ? "default" : offersCount > 2 ? "secondary" : "outline"}>
                  {offersCount > 5 ? 'Высокий' : offersCount > 2 ? 'Средний' : 'Низкий'}
                </Badge>
              </div>
            </div>

            {/* Views Chart */}
            <div className="h-64">
              <h3 className="text-lg font-semibold mb-4">Просмотры за неделю</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={viewsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Engagement metrics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Показатели вовлеченности</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span>Время на странице</span>
                    <span className="font-semibold">2:34 мин</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span>Возвраты на страницу</span>
                    <span className="font-semibold">12%</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span>Просмотр контактов</span>
                    <span className="font-semibold">{Math.floor(viewCount * 0.15)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span>Сохранили в избранное</span>
                    <span className="font-semibold">{Math.floor(viewCount * 0.08)}</span>
                  </div>
                </div>
              </div>

              {/* Traffic sources */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Источники трафика</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Поиск по сайту</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div className="w-16 bg-primary h-2 rounded-full"></div>
                      </div>
                      <span className="text-sm">67%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Прямые переходы</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div className="w-6 bg-blue-500 h-2 rounded-full"></div>
                      </div>
                      <span className="text-sm">25%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Социальные сети</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div className="w-2 bg-green-500 h-2 rounded-full"></div>
                      </div>
                      <span className="text-sm">8%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="offers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Offers by price range */}
              <div className="h-64">
                <h3 className="text-lg font-semibold mb-4">Распределение предложений по цене</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={offersData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="price" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Offers by status */}
              <div className="h-64">
                <h3 className="text-lg font-semibold mb-4">Статус предложений</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Offers insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Средняя цена предложения</span>
                </div>
                <div className="text-2xl font-bold">
                  {maxOfferPrice ? `${Math.floor(maxOfferPrice * 0.9).toLocaleString('ru-RU')} ₽` : '—'}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Ср. время ответа</span>
                </div>
                <div className="text-2xl font-bold">4.2ч</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Коэф. принятия</span>
                </div>
                <div className="text-2xl font-bold">
                  {offersCount > 0 ? `${Math.floor(30 / offersCount * 100)}%` : '—'}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SellerAnalyticsDashboard;