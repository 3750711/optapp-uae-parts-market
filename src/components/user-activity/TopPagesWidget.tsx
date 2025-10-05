import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ActivityEvent } from '@/hooks/user-activity/useActivityData';
import { getTopPages } from '@/utils/user-activity/activityCalculations';

interface TopPagesWidgetProps {
  data: ActivityEvent[];
}

export const TopPagesWidget: React.FC<TopPagesWidgetProps> = ({ data }) => {
  const topPages = useMemo(() => getTopPages(data, 10), [data]);

  if (topPages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Топ-10 страниц</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Нет данных для отображения</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Топ-10 страниц</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topPages} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              type="number" 
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              type="category" 
              dataKey="path" 
              width={150}
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(value) => value.length > 20 ? value.substring(0, 20) + '...' : value}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Bar 
              dataKey="views" 
              fill="hsl(var(--primary))" 
              name="Просмотры"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
