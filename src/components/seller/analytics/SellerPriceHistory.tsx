import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Edit3 } from "lucide-react";

interface SellerPriceHistoryProps {
  currentPrice: number;
  productId: string;
}

// Mock данные истории цен - в реальном приложении должно приходить с бэкенда
const priceHistory = [
  { date: '01.11', price: 52000, offers: 2 },
  { date: '05.11', price: 50000, offers: 3 },
  { date: '10.11', price: 48000, offers: 5 },
  { date: '15.11', price: 48000, offers: 7 },
  { date: '20.11', price: 46000, offers: 8 },
  { date: '25.11', price: 46000, offers: 6 },
  { date: '30.11', price: 45000, offers: 4 },
];

const recommendedPrices = [
  { type: 'Быстрая продажа', price: 42000, probability: 85, color: 'bg-green-500' },
  { type: 'Оптимальная', price: 45000, probability: 65, color: 'bg-blue-500' },
  { type: 'Максимальная', price: 48000, probability: 35, color: 'bg-orange-500' },
];

const SellerPriceHistory: React.FC<SellerPriceHistoryProps> = ({
  currentPrice,
  productId
}) => {
  const lastPrice = priceHistory[priceHistory.length - 2]?.price || currentPrice;
  const priceChange = currentPrice - lastPrice;
  const priceChangePercent = ((priceChange / lastPrice) * 100).toFixed(1);

  const avgOfferPrice = 43000; // Mock данные
  const marketPrice = 47000; // Mock данные

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            История цены и рекомендации
          </CardTitle>
          <Button variant="outline" size="sm">
            <Edit3 className="h-4 w-4 mr-2" />
            Изменить цену
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Price Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Текущая цена</p>
            <p className="text-2xl font-bold">{currentPrice.toLocaleString('ru-RU')} ₽</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              {priceChange > 0 ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              <span className={`text-sm ${priceChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {priceChangePercent}%
              </span>
            </div>
          </div>

          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Средняя цена предложений</p>
            <p className="text-2xl font-bold">{avgOfferPrice.toLocaleString('ru-RU')} ₽</p>
            <Badge variant="secondary" className="mt-1">
              -{Math.floor((currentPrice - avgOfferPrice) / currentPrice * 100)}%
            </Badge>
          </div>

          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Рыночная цена</p>
            <p className="text-2xl font-bold">{marketPrice.toLocaleString('ru-RU')} ₽</p>
            <Badge variant={currentPrice < marketPrice ? "default" : "destructive"} className="mt-1">
              {currentPrice < marketPrice ? 'Конкурентная' : 'Высокая'}
            </Badge>
          </div>

          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Изменений цены</p>
            <p className="text-2xl font-bold">{priceHistory.length}</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">за месяц</span>
            </div>
          </div>
        </div>

        {/* Price Chart */}
        <div className="h-64">
          <h3 className="text-lg font-semibold mb-4">График изменения цены</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={['dataMin - 2000', 'dataMax + 2000']} />
              <Tooltip 
                formatter={(value, name) => [
                  `${value.toLocaleString('ru-RU')} ₽`,
                  name === 'price' ? 'Цена' : 'Предложения'
                ]}
              />
              <ReferenceLine y={avgOfferPrice} stroke="#10b981" strokeDasharray="5 5" label="Средняя цена предложений" />
              <ReferenceLine y={marketPrice} stroke="#f59e0b" strokeDasharray="5 5" label="Рыночная цена" />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="offers" 
                stroke="#10b981" 
                strokeWidth={2}
                yAxisId="right"
                dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Price Recommendations */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Рекомендации по цене</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedPrices.map((recommendation, index) => (
              <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">{recommendation.type}</span>
                  <div className={`w-3 h-3 rounded-full ${recommendation.color}`}></div>
                </div>
                
                <div className="text-2xl font-bold mb-2">
                  {recommendation.price.toLocaleString('ru-RU')} ₽
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Вероятность продажи</span>
                  <Badge variant="outline">{recommendation.probability}%</Badge>
                </div>
                
                <div className="mt-3 w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${recommendation.color}`}
                    style={{ width: `${recommendation.probability}%` }}
                  ></div>
                </div>

                {recommendation.price !== currentPrice && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={() => {/* Логика изменения цены */}}
                  >
                    Установить эту цену
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Price Change Impact */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-semibold mb-3">Влияние изменения цены</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-green-500" />
              <span>Снижение на 5%: +40% предложений</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <span>Повышение на 5%: -25% предложений</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <span>Оптимальная цена: 44,000-46,000 ₽</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SellerPriceHistory;