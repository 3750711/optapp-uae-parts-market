import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ActivityEvent } from '@/hooks/user-activity/useActivityData';
import { groupByHour } from '@/utils/user-activity/activityCalculations';

interface ActivityTimelineProps {
  data: ActivityEvent[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ data }) => {
  const hourlyData = useMemo(() => groupByHour(data), [data]);

  if (hourlyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Активность за последние 24 часа</CardTitle>
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
        <CardTitle>Активность за последние 24 часа</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={hourlyData}>
            <defs>
              <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="time" 
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="events" 
              stroke="hsl(var(--primary))" 
              fillOpacity={1} 
              fill="url(#colorEvents)"
              name="Всего событий"
            />
            <Line 
              type="monotone" 
              dataKey="errors" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2}
              name="Ошибки"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
