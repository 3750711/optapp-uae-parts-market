import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatisticsOverview } from './StatisticsOverview';
import { ActivityFilters } from './ActivityFilters';
import { ActivityTimeline } from './ActivityTimeline';
import { UserActivityTable } from './UserActivityTable';
import { TopPagesWidget } from './TopPagesWidget';
import { ErrorsPanel } from './ErrorsPanel';
import { useActivityData } from '@/hooks/user-activity/useActivityData';
import { useActivityFilters } from '@/hooks/user-activity/useActivityFilters';
import { useActivityMetrics } from '@/hooks/user-activity/useActivityMetrics';
import { BarChart3, ListFilter, AlertTriangle } from 'lucide-react';

export const UserActivityDashboard: React.FC = () => {
  const { filters, setFilters, resetFilters } = useActivityFilters();
  const { data = [], isLoading, error } = useActivityData(filters);
  const metrics = useActivityMetrics(data);

  console.log('📊 [UserActivityDashboard] State:', {
    isLoading,
    hasError: !!error,
    dataLength: data.length,
    filters
  });

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <StatisticsOverview metrics={metrics} />

      {/* Фильтры */}
      <ActivityFilters 
        filters={filters} 
        onFilterChange={setFilters}
        onReset={resetFilters}
      />

      {/* Табы с разными представлениями */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Временная шкала
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <ListFilter className="h-4 w-4" />
            События
          </TabsTrigger>
          <TabsTrigger value="errors" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Ошибки
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <ActivityTimeline data={data} />
          <TopPagesWidget data={data} />
        </TabsContent>

        <TabsContent value="events">
          <UserActivityTable data={data} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="errors">
          <ErrorsPanel data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
