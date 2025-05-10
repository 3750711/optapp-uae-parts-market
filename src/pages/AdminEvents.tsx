
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { ArrowUpDown, ExternalLink, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

interface ActionLog {
  id: string;
  created_at: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  user_id: string;
  user_email?: string;
}

const AdminEvents = () => {
  const { isAdmin } = useAdminAccess();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'created_at' | 'entity_type' | 'action_type'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'action-logs', currentPage, sortField, sortOrder, entityFilter, actionFilter],
    queryFn: async () => {
      let query = supabase
        .from('action_logs')
        .select(`
          *,
          profiles!action_logs_user_id_fkey (email)
        `)
        .order(sortField, { ascending: sortOrder === 'asc' });
      
      // Apply entity type filter
      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }
      
      // Apply action type filter
      if (actionFilter !== 'all') {
        query = query.eq('action_type', actionFilter);
      }
      
      const { data, error, count } = await query
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);
      
      if (error) throw error;
      
      // Transform data to include user_email
      const transformedData = data.map((log: any) => ({
        ...log,
        user_email: log.profiles?.email
      }));
      
      return {
        logs: transformedData as ActionLog[],
        totalCount: count || 0
      };
    },
    enabled: isAdmin
  });

  const totalPages = data ? Math.ceil(data.totalCount / pageSize) : 0;

  const handleSortChange = (value: string) => {
    const [field, order] = value.split('-');
    setSortField(field as 'created_at' | 'entity_type' | 'action_type');
    setSortOrder(order as 'asc' | 'desc');
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEntityTypeLabel = (entityType: string) => {
    switch (entityType) {
      case 'product':
        return 'Товар';
      case 'order':
        return 'Заказ';
      case 'user':
        return 'Пользователь';
      case 'store':
        return 'Магазин';
      default:
        return entityType;
    }
  };

  const getActionTypeLabel = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return 'Создание';
      case 'update':
        return 'Обновление';
      case 'delete':
        return 'Удаление';
      default:
        return actionType;
    }
  };

  const renderDetails = (log: ActionLog) => {
    if (!log.details) return 'Нет данных';

    if (log.entity_type === 'product') {
      if (log.action_type === 'create') {
        return (
          <div className="space-y-1">
            <div><span className="font-medium">Название:</span> {log.details.title}</div>
            <div><span className="font-medium">Цена:</span> {log.details.price} $</div>
            <div><span className="font-medium">Продавец:</span> {log.details.seller_name}</div>
            <div><span className="font-medium">Статус:</span> <Badge variant="outline">{log.details.status}</Badge></div>
          </div>
        );
      } else if (log.action_type === 'update' && log.details.old_status && log.details.new_status) {
        return (
          <div className="space-y-1">
            <div><span className="font-medium">Название:</span> {log.details.title}</div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Статус:</span> 
              <Badge variant="outline">{log.details.old_status}</Badge>
              <span>→</span>
              <Badge variant="outline">{log.details.new_status}</Badge>
            </div>
          </div>
        );
      } else if (log.action_type === 'delete') {
        return (
          <div className="space-y-1">
            <div><span className="font-medium">Название:</span> {log.details.title}</div>
            <div><span className="font-medium">Цена:</span> {log.details.price} $</div>
            <div><span className="font-medium">Продавец:</span> {log.details.seller_name}</div>
          </div>
        );
      }
    }
    
    // Default fallback for other types of logs
    return (
      <div className="max-w-xs truncate font-mono text-xs">
        {JSON.stringify(log.details)}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Журнал событий</h1>
          
          <div className="flex items-center gap-3">
            <Select
              value={`${sortField}-${sortOrder}`}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Сначала новые</SelectItem>
                <SelectItem value="created_at-asc">Сначала старые</SelectItem>
                <SelectItem value="entity_type-asc">По типу объекта (А-Я)</SelectItem>
                <SelectItem value="entity_type-desc">По типу объекта (Я-А)</SelectItem>
                <SelectItem value="action_type-asc">По типу действия (А-Я)</SelectItem>
                <SelectItem value="action_type-desc">По типу действия (Я-А)</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>Фильтры</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs">Тип объекта</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setEntityFilter('all')} className={entityFilter === 'all' ? 'bg-accent' : ''}>
                    Все
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEntityFilter('product')} className={entityFilter === 'product' ? 'bg-accent' : ''}>
                    Товары
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEntityFilter('order')} className={entityFilter === 'order' ? 'bg-accent' : ''}>
                    Заказы
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEntityFilter('user')} className={entityFilter === 'user' ? 'bg-accent' : ''}>
                    Пользователи
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs">Тип действия</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setActionFilter('all')} className={actionFilter === 'all' ? 'bg-accent' : ''}>
                    Все
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActionFilter('create')} className={actionFilter === 'create' ? 'bg-accent' : ''}>
                    Создание
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActionFilter('update')} className={actionFilter === 'update' ? 'bg-accent' : ''}>
                    Обновление
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActionFilter('delete')} className={actionFilter === 'delete' ? 'bg-accent' : ''}>
                    Удаление
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата и время</TableHead>
                <TableHead>Тип действия</TableHead>
                <TableHead>Объект</TableHead>
                <TableHead>ID объекта</TableHead>
                <TableHead>Пользователь</TableHead>
                <TableHead>Детали</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : data?.logs && data.logs.length > 0 ? (
                data.logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionTypeColor(log.action_type)}>
                        {getActionTypeLabel(log.action_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getEntityTypeLabel(log.entity_type)}</TableCell>
                    <TableCell>
                      {log.entity_id ? (
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs truncate max-w-[80px]">{log.entity_id}</span>
                          {log.entity_type === 'product' && (
                            <Link to={`/product/${log.entity_id}`} target="_blank" className="text-blue-600 hover:text-blue-800">
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-mono text-xs truncate">{log.user_email || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground truncate">{log.user_id ? log.user_id.substring(0, 8) + '...' : 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderDetails(log)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Записи не найдены
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {totalPages > 1 && (
            <div className="p-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show pages around current page
                    const pageNumbers = [];
                    const startPage = Math.max(1, currentPage - 2);
                    const endPage = Math.min(totalPages, startPage + 4);
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pageNumbers.push(i);
                    }
                    
                    return pageNumbers.map(pageNum => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          isActive={pageNum === currentPage}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    ));
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminEvents;
