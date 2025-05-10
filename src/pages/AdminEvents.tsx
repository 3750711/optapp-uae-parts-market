import React, { useState, useEffect } from 'react';
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
import { ArrowUpDown, BookmarkPlus, ExternalLink, Filter, Save, Search, Upload } from 'lucide-react';
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
import SaveEventLogsDialog from '@/components/admin/SaveEventLogsDialog';
import SavedEventLogsDialog from '@/components/admin/SavedEventLogsDialog';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'created_at' | 'entity_type' | 'action_type'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [filteredLogs, setFilteredLogs] = useState<ActionLog[]>([]);
  const pageSize = 10;

  // Create a test log entry on component mount to verify logging functionality
  useEffect(() => {
    const createTestLog = async () => {
      if (isAdmin) {
        console.log("Attempting to create a test log entry...");
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        
        if (!userId) return;
        
        const { data, error } = await supabase
          .from("action_logs")
          .insert({
            action_type: "test",
            entity_type: "system",
            user_id: userId,
            details: {
              message: "Test log entry to verify action_logs functionality",
              timestamp: new Date().toISOString(),
            }
          })
          .select();
          
        if (error) {
          console.error("Error creating test log:", error);
        } else {
          console.log("Test log created successfully:", data);
          // Refetch logs after creating the test entry
          refetch();
        }
      }
    };
    
    createTestLog();
  }, [isAdmin]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'action-logs', currentPage, sortField, sortOrder, entityFilter, actionFilter],
    queryFn: async () => {
      // Start building the query
      let query = supabase
        .from('action_logs')
        .select(`
          *,
          profiles:user_id (email)
        `, { count: 'exact' })
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
      
      if (error) {
        console.error("Error fetching action logs:", error);
        throw error;
      }

      console.log("Fetched action logs:", data);
      console.log("Count:", count);

      // Process the data to include user email
      const processedData = data.map((log: any) => ({
        ...log,
        user_email: log.profiles?.email,
      }));
      
      // Update the filtered logs state for saving purposes
      setFilteredLogs(processedData);
      
      return {
        logs: processedData as ActionLog[],
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
      case 'login':
        return 'bg-purple-100 text-purple-800';
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
      case 'login':
        return 'Вход';
      default:
        return actionType;
    }
  };
  
  const handleLoadSavedLogs = (logs: ActionLog[]) => {
    if (Array.isArray(logs) && logs.length > 0) {
      setFilteredLogs(logs);
      toast({
        title: "Загружено",
        description: `Загружено ${logs.length} записей из сохраненного набора`,
      });
    } else {
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить записи из сохраненного набора",
        variant: "destructive"
      });
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
    } else if (log.entity_type === 'user') {
      if (log.action_type === 'create') {
        return (
          <div className="space-y-1">
            <div><span className="font-medium">Email:</span> {log.details.email}</div>
            <div><span className="font-medium">Тип:</span> {log.details.user_type || 'Не указан'}</div>
            <div><span className="font-medium">Создан:</span> {format(new Date(log.details.created_at), 'dd.MM.yyyy HH:mm:ss')}</div>
          </div>
        );
      } else if (log.action_type === 'login') {
        return (
          <div className="space-y-1">
            <div><span className="font-medium">IP адрес:</span> {log.details.ip || 'Не указан'}</div>
            <div><span className="font-medium">Время входа:</span> {format(new Date(log.details.created_at), 'dd.MM.yyyy HH:mm:ss')}</div>
            {log.user_email && <div><span className="font-medium">Email:</span> {log.user_email}</div>}
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
            <Button 
              variant="outline" 
              size="sm"
              className="gap-1"
              onClick={() => setSaveDialogOpen(true)}
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Сохранить</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              className="gap-1"
              onClick={() => setLoadDialogOpen(true)}
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Загрузить</span>
            </Button>
            
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
                  <DropdownMenuItem onClick={() => setEntityFilter('system')} className={entityFilter === 'system' ? 'bg-accent' : ''}>
                    Система
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
                  <DropdownMenuItem onClick={() => setActionFilter('login')} className={actionFilter === 'login' ? 'bg-accent' : ''}>
                    Вход
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActionFilter('test')} className={actionFilter === 'test' ? 'bg-accent' : ''}>
                    Тест
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
              ) : data && data.logs && data.logs.length > 0 ? (
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
                          {log.entity_type === 'user' && log.entity_id && (
                            <Link to={`/admin/users`} className="text-blue-600 hover:text-blue-800">
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs truncate max-w-[80px]">
                          {log.user_id ? log.user_id.substring(0, 8) + '...' : 'N/A'}
                        </span>
                        {log.user_email && (
                          <span className="text-xs text-gray-500">{log.user_email}</span>
                        )}
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
                    Записи не найдены. 
                    <Button 
                      variant="link" 
                      className="p-0 h-auto font-normal" 
                      onClick={() => refetch()}
                    >
                      Обновить
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {data && data.totalCount > 0 && data.totalCount > pageSize && (
            <div className="p-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {(() => {
                    // Show pages around current page
                    const totalPages = Math.ceil(data.totalCount / pageSize);
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
                  })()}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => {
                        const totalPages = Math.ceil(data.totalCount / pageSize);
                        setCurrentPage(Math.min(totalPages, currentPage + 1));
                      }}
                      className={currentPage === Math.ceil(data.totalCount / pageSize) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </Card>
      </div>

      {/* Диалоги для сохранения и загрузки журналов событий */}
      <SaveEventLogsDialog 
        open={saveDialogOpen} 
        onOpenChange={setSaveDialogOpen}
        logs={filteredLogs || []} 
        onSuccess={() => {
          refetch();
          toast({
            title: "Успешно сохранено",
            description: "Журнал событий сохранен",
          });
        }}
      />
      
      <SavedEventLogsDialog 
        open={loadDialogOpen} 
        onOpenChange={setLoadDialogOpen}
        onSelectLogs={handleLoadSavedLogs} 
      />
    </AdminLayout>
  );
};

export default AdminEvents;
