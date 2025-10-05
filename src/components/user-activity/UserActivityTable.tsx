import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ActivityEvent } from '@/hooks/user-activity/useActivityData';
import { formatDateTime, getUserAgentShort, getEventTypeLabel, getEventTypeColor } from '@/utils/user-activity/activityFormatters';

interface UserActivityTableProps {
  data: ActivityEvent[];
  isLoading?: boolean;
}

export const UserActivityTable: React.FC<UserActivityTableProps> = ({ data, isLoading }) => {
  const [page, setPage] = useState(1);
  const pageSize = 50;
  
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page]);

  const totalPages = Math.ceil(data.length / pageSize);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Загрузка...</p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Нет данных для отображения</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Время</TableHead>
                <TableHead>Пользователь</TableHead>
                <TableHead>Тип события</TableHead>
                <TableHead>Путь/Действие</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Браузер</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-mono text-sm whitespace-nowrap">
                    {formatDateTime(event.created_at)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {event.profiles?.full_name || 'Аноним'}
                      </div>
                      {event.profiles?.email && (
                        <div className="text-xs text-muted-foreground">
                          {event.profiles.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getEventTypeColor(event.action_type)}>
                      {getEventTypeLabel(event.action_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {event.path || event.event_subtype || '-'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {event.ip_address || '-'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs">
                    {getUserAgentShort(event.user_agent)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Пагинация */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Показано {paginatedData.length} из {data.length.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
