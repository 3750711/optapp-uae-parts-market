
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, 
  MinusCircle,
  AlertCircle,
  FileText,
  Trash,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import SavedEventLogsDialog from '@/components/admin/SavedEventLogsDialog';
import SaveEventLogsDialog from '@/components/admin/SaveEventLogsDialog';

type EventLog = {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  details: any;
  created_at: string;
};

const AdminEvents = () => {
  const { isAdmin } = useAdminAccess();
  const { toast } = useToast();
  const [selectedLogs, setSelectedLogs] = useState<EventLog[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savedLogsDialogOpen, setSavedLogsDialogOpen] = useState(false);

  const { 
    data: eventLogs, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['admin', 'event-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as EventLog[];
    },
    enabled: isAdmin
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Обновлено",
      description: "Журнал событий был обновлен",
    });
  };

  const getActionBadge = (action_type: string) => {
    switch (action_type) {
      case 'create':
        return <Badge className="bg-green-100 text-green-800">Создание</Badge>;
      case 'update':
        return <Badge className="bg-blue-100 text-blue-800">Обновление</Badge>;
      case 'delete':
        return <Badge className="bg-red-100 text-red-800">Удаление</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{action_type}</Badge>;
    }
  };

  const getEntityIcon = (entity_type: string) => {
    switch (entity_type) {
      case 'product':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'order':
        return <FileText className="h-4 w-4 text-green-600" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatEventDetails = (details: any, action_type: string) => {
    if (!details) return 'Нет данных';
    
    if (action_type === 'update' && details.old_status && details.new_status) {
      return (
        <div className="flex flex-col">
          <span className="font-medium">{details.title}</span>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Статус:</span>
            <Badge className="bg-gray-100 text-gray-800">{details.old_status}</Badge>
            <span>→</span>
            <Badge className="bg-green-100 text-green-800">{details.new_status}</Badge>
          </div>
        </div>
      );
    }
    
    if (details.title) {
      return (
        <div className="flex flex-col">
          <span className="font-medium">{details.title}</span>
          {details.price && <span className="text-sm text-gray-600">Цена: {details.price} $</span>}
          {details.seller_name && <span className="text-sm text-gray-600">Продавец: {details.seller_name}</span>}
        </div>
      );
    }
    
    return JSON.stringify(details);
  };

  const toggleSelectLog = (log: EventLog) => {
    if (selectedLogs.some(selected => selected.id === log.id)) {
      setSelectedLogs(selectedLogs.filter(selected => selected.id !== log.id));
    } else {
      setSelectedLogs([...selectedLogs, log]);
    }
  };

  const isLogSelected = (logId: string) => {
    return selectedLogs.some(selected => selected.id === logId);
  };

  const handleOpenSavedLogsDialog = () => {
    setSavedLogsDialogOpen(true);
  };

  const handleOpenSaveDialog = () => {
    if (selectedLogs.length > 0) {
      setSaveDialogOpen(true);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Журнал событий</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Обновить
            </Button>
            
            {selectedLogs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenSaveDialog}
                className="flex items-center gap-1"
              >
                Сохранить выбранное
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenSavedLogsDialog}
              className="flex items-center gap-1"
            >
              Сохраненные логи
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Последние события</CardTitle>
              {selectedLogs.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Выбрано: {selectedLogs.length}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedLogs([])}
                  >
                    Очистить
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                <p className="text-red-500">Ошибка загрузки журнала событий</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => refetch()}
                >
                  Попробовать снова
                </Button>
              </div>
            )}

            {!isLoading && !error && eventLogs?.length === 0 && (
              <div className="text-center py-8">
                Журнал событий пуст.
              </div>
            )}

            {!isLoading && !error && eventLogs && eventLogs.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Время</TableHead>
                      <TableHead>Действие</TableHead>
                      <TableHead>Сущность</TableHead>
                      <TableHead>Детали</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventLogs.map((log) => (
                      <TableRow 
                        key={log.id} 
                        className={isLogSelected(log.id) ? "bg-muted" : ""}
                      >
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleSelectLog(log)}
                          >
                            {isLogSelected(log.id) ? (
                              <MinusCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <PlusCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell>{getActionBadge(log.action_type)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEntityIcon(log.entity_type)}
                            <span className="capitalize">{log.entity_type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatEventDetails(log.details, log.action_type)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <SaveEventLogsDialog 
        logs={selectedLogs}
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSuccess={() => {
          setSelectedLogs([]);
          setSaveDialogOpen(false);
        }}
      />
      
      <SavedEventLogsDialog 
        open={savedLogsDialogOpen}
        onOpenChange={setSavedLogsDialogOpen}
        onSelectLogs={(logs) => {
          setSelectedLogs(logs);
          setSavedLogsDialogOpen(false);
        }}
      />
    </AdminLayout>
  );
};

export default AdminEvents;
