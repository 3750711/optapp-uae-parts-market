import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface UploadLog {
  id: number;
  created_at: string;
  user_id: string;
  file_url: string | null;
  method: string | null;
  duration_ms: number | null;
  status: 'success' | 'error';
  error_details: string | null;
  original_size: number | null;
  compressed_size: number | null;
  compression_ratio: number | null;
  user_email?: string;
}

const AdminFreeOrderUploadMonitoring = () => {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Helper function to format file size
  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '—';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) {
      return `${mb.toFixed(1)} MB`;
    }
    return `${kb.toFixed(1)} KB`;
  };

  // Helper function to format compression ratio
  const formatCompressionRatio = (ratio: number | null): string => {
    if (!ratio) return '—';
    const percentage = Math.round((1 - ratio) * 100);
    return `${percentage}%`;
  };

  const { data: logsData, isLoading, error } = useQuery({
    queryKey: ['freeOrderUploadLogs', page],
    queryFn: async () => {
      const offset = (page - 1) * pageSize;
      
      // Get logs with user profiles (left join to include logs without profiles)
      const { data: logs, error: logsError } = await supabase
        .from('free_order_upload_logs')
        .select(`
          id,
          created_at,
          user_id,
          file_url,
          method,
          duration_ms,
          status,
          error_details,
          original_size,
          compressed_size,
          compression_ratio,
          profiles(email)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (logsError) throw logsError;

      // Transform data to include user email
      const transformedLogs = logs?.map(log => ({
        ...log,
        user_email: (log as any).profiles?.email || `ID: ${log.user_id || 'неизвестен'}`
      })) || [];

      return {
        logs: transformedLogs,
        hasMore: logs?.length === pageSize
      };
    }
  });

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (logsData?.hasMore) setPage(page + 1);
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">Ошибка загрузки данных: {error.message}</p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <DashboardHeader title="Мониторинг загрузки фото в свободном заказе" />
        
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Время</th>
                        <th className="text-left p-2 font-medium">Пользователь</th>
                        <th className="text-left p-2 font-medium">Файл</th>
                        <th className="text-left p-2 font-medium">Статус</th>
                        <th className="text-left p-2 font-medium">Метод</th>
                        <th className="text-left p-2 font-medium">Время (мс)</th>
                        <th className="text-left p-2 font-medium">Исходный размер</th>
                        <th className="text-left p-2 font-medium">Сжатый размер</th>
                        <th className="text-left p-2 font-medium">Сжатие</th>
                        <th className="text-left p-2 font-medium">Ошибка</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logsData?.logs.map((log) => (
                        <tr key={log.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 text-sm">
                            {format(new Date(log.created_at), 'dd.MM.yy HH:mm', { locale: ru })}
                          </td>
                          <td className="p-2 text-sm">
                            <div className="max-w-[150px] truncate" title={log.user_email}>
                              {log.user_email}
                            </div>
                          </td>
                          <td className="p-2 text-sm">
                            {log.file_url ? (
                              <a 
                                href={log.file_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Файл
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-2">
                            <Badge 
                              variant={log.status === 'success' ? 'default' : 'destructive'}
                              className={log.status === 'success' ? 'bg-green-500 hover:bg-green-600' : ''}
                            >
                              {log.status === 'success' ? 'Успех' : 'Ошибка'}
                            </Badge>
                          </td>
                          <td className="p-2 text-sm">
                            {log.method || '—'}
                          </td>
                          <td className="p-2 text-sm">
                            {log.duration_ms ? `${log.duration_ms}` : '—'}
                          </td>
                          <td className="p-2 text-sm">
                            {formatFileSize(log.original_size)}
                          </td>
                          <td className="p-2 text-sm">
                            {formatFileSize(log.compressed_size)}
                          </td>
                          <td className="p-2 text-sm">
                            <span className={log.compression_ratio && log.compression_ratio < 0.8 ? 'text-green-600 font-medium' : ''}>
                              {formatCompressionRatio(log.compression_ratio)}
                            </span>
                          </td>
                          <td className="p-2 text-sm">
                            {log.error_details ? (
                              <div 
                                className="max-w-[200px] truncate text-destructive cursor-help" 
                                title={log.error_details}
                              >
                                {log.error_details}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {logsData?.logs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Логи загрузки не найдены
                  </div>
                )}

                <div className="flex justify-between items-center mt-6">
                  <Button
                    variant="outline"
                    onClick={handlePrevPage}
                    disabled={page === 1}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Назад
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    Страница {page}
                  </span>
                  
                  <Button
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={!logsData?.hasMore}
                    className="flex items-center gap-2"
                  >
                    Вперед
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminFreeOrderUploadMonitoring;