import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  Target, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Star,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface SellerPerformanceMetricsProps {
  productId: string;
  sellerRating?: number;
  responseTime?: number;
}

const SellerPerformanceMetrics: React.FC<SellerPerformanceMetricsProps> = ({
  productId,
  sellerRating = 4.5,
  responseTime = 2.5
}) => {
  // Mock данные производительности - в реальном приложении с бэкенда
  const metrics = {
    avgResponseTime: responseTime,
    conversionRate: 18.5,
    customerSatisfaction: 4.2,
    repeatCustomers: 12,
    viewToOfferRate: 12.8,
    negotiationSuccessRate: 65,
    avgNegotiationTime: 3.2,
    competitivePosition: 78
  };

  const performanceScore = Math.round(
    (metrics.conversionRate * 0.3) + 
    (metrics.negotiationSuccessRate * 0.25) + 
    (metrics.customerSatisfaction * 20 * 0.25) + 
    (100 - metrics.avgResponseTime * 5) * 0.2
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { variant: "default" as const, text: "Отлично" };
    if (score >= 60) return { variant: "secondary" as const, text: "Хорошо" };
    return { variant: "destructive" as const, text: "Требует внимания" };
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Показатели эффективности
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Performance Score */}
        <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl dark:from-blue-950 dark:to-purple-950">
          <h3 className="text-lg font-semibold mb-2">Общий показатель эффективности</h3>
          <div className={`text-4xl font-bold mb-2 ${getScoreColor(performanceScore)}`}>
            {performanceScore}/100
          </div>
          <Badge {...getScoreBadge(performanceScore)}>
            {getScoreBadge(performanceScore).text}
          </Badge>
          <Progress value={performanceScore} className="mt-4 h-3" />
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Response Time */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Время ответа</span>
            </div>
            <div className="text-2xl font-bold mb-1">{metrics.avgResponseTime}ч</div>
            <div className="flex items-center gap-1">
              <Progress value={100 - (metrics.avgResponseTime * 10)} className="flex-1 h-2" />
              <Badge variant={metrics.avgResponseTime <= 4 ? "default" : "destructive"} className="text-xs">
                {metrics.avgResponseTime <= 4 ? "Быстро" : "Медленно"}
              </Badge>
            </div>
          </Card>

          {/* Conversion Rate */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Конверсия</span>
            </div>
            <div className="text-2xl font-bold mb-1">{metrics.conversionRate}%</div>
            <div className="flex items-center gap-1">
              <Progress value={metrics.conversionRate * 5} className="flex-1 h-2" />
              <Badge variant={metrics.conversionRate >= 15 ? "default" : "secondary"} className="text-xs">
                {metrics.conversionRate >= 15 ? "Высокая" : "Средняя"}
              </Badge>
            </div>
          </Card>

          {/* Customer Satisfaction */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Удовлетворенность</span>
            </div>
            <div className="text-2xl font-bold mb-1">{metrics.customerSatisfaction}/5</div>
            <div className="flex items-center gap-1">
              <Progress value={metrics.customerSatisfaction * 20} className="flex-1 h-2" />
              <Badge variant={metrics.customerSatisfaction >= 4 ? "default" : "secondary"} className="text-xs">
                {metrics.customerSatisfaction >= 4 ? "Отлично" : "Хорошо"}
              </Badge>
            </div>
          </Card>

          {/* Negotiation Success */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Успех переговоров</span>
            </div>
            <div className="text-2xl font-bold mb-1">{metrics.negotiationSuccessRate}%</div>
            <div className="flex items-center gap-1">
              <Progress value={metrics.negotiationSuccessRate} className="flex-1 h-2" />
              <Badge variant={metrics.negotiationSuccessRate >= 60 ? "default" : "secondary"} className="text-xs">
                {metrics.negotiationSuccessRate >= 60 ? "Хорошо" : "Средне"}
              </Badge>
            </div>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <h4 className="font-semibold">Детальная статистика</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span>Просмотр → Предложение</span>
                </div>
                <span className="font-semibold">{metrics.viewToOfferRate}%</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span>Среднее время сделки</span>
                </div>
                <span className="font-semibold">{metrics.avgNegotiationTime} дня</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-500" />
                  <span>Повторные покупатели</span>
                </div>
                <span className="font-semibold">{metrics.repeatCustomers}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-500" />
                  <span>Конкурентная позиция</span>
                </div>
                <Badge variant={metrics.competitivePosition >= 70 ? "default" : "secondary"}>
                  {metrics.competitivePosition}%
                </Badge>
              </div>
            </div>
          </div>

          {/* Right Column - Recommendations */}
          <div className="space-y-4">
            <h4 className="font-semibold">Рекомендации по улучшению</h4>
            
            <div className="space-y-3">
              {metrics.avgResponseTime > 4 && (
                <div className="flex gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-950 dark:border-yellow-800">
                  <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">Ускорьте ответы</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Отвечайте на предложения в течение 2 часов для лучших результатов
                    </p>
                  </div>
                </div>
              )}

              {metrics.conversionRate < 15 && (
                <div className="flex gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
                  <TrendingUp className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-200">Улучшите конверсию</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Добавьте больше фотографий и детальное описание товара
                    </p>
                  </div>
                </div>
              )}

              {metrics.competitivePosition < 70 && (
                <div className="flex gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg dark:bg-purple-950 dark:border-purple-800">
                  <Target className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-purple-800 dark:text-purple-200">Пересмотрите цену</p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Ваша цена выше рыночной. Рассмотрите снижение на 5-10%
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950 dark:border-green-800">
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Отличная работа!</p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Вы показываете хорошие результаты в переговорах и обслуживании клиентов
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Competitive Analysis */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Сравнение с другими продавцами
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">Время ответа</p>
              <div className="text-lg font-semibold mt-1">
                Лучше {Math.round(100 - (metrics.avgResponseTime / 6 * 100))}% продавцов
              </div>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Конверсия</p>
              <div className="text-lg font-semibold mt-1">
                Лучше {Math.round(metrics.conversionRate / 25 * 100)}% продавцов
              </div>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Рейтинг</p>
              <div className="text-lg font-semibold mt-1">
                Топ {Math.round(100 - (sellerRating / 5 * 100))}% продавцов
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SellerPerformanceMetrics;