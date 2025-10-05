import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, RefreshCw } from 'lucide-react';
import { ActivityFilters as Filters } from '@/hooks/user-activity/useActivityFilters';

interface ActivityFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onReset: () => void;
}

export const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const hasActiveFilters = 
    filters.eventType !== 'all' || 
    filters.userId !== 'all' || 
    filters.dateRange || 
    filters.search;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-4">
          {/* Тип события */}
          <Select 
            value={filters.eventType || 'all'} 
            onValueChange={(value) => onFilterChange({ ...filters, eventType: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Тип события" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все события</SelectItem>
              <SelectItem value="page_view">Просмотр страницы</SelectItem>
              <SelectItem value="login">Вход</SelectItem>
              <SelectItem value="logout">Выход</SelectItem>
              <SelectItem value="button_click">Клик</SelectItem>
              <SelectItem value="client_error">Ошибка клиента</SelectItem>
              <SelectItem value="api_error">Ошибка API</SelectItem>
              <SelectItem value="create">Создание</SelectItem>
              <SelectItem value="update">Обновление</SelectItem>
              <SelectItem value="delete">Удаление</SelectItem>
            </SelectContent>
          </Select>

          {/* Поиск */}
          <Input
            placeholder="Поиск по пути или действию..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-[250px]"
          />

          {/* Сброс фильтров */}
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              onClick={onReset}
              size="sm"
            >
              <X className="h-4 w-4 mr-2" />
              Сбросить
            </Button>
          )}
          
          {/* Обновить */}
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
