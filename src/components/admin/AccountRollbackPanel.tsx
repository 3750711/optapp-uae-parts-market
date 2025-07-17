import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Undo2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface BackupRecord {
  id: string;
  user_id: string;
  operation_type: string;
  backup_data: any;
  created_at: string;
  restored_at: string | null;
  created_by: string;
}

export const AccountRollbackPanel: React.FC = () => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  const fetchBackups = async () => {
    try {
      const { data, error } = await supabase
        .from('account_operation_backups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBackups(data || []);
    } catch (error) {
      console.error('Error fetching backups:', error);
      toast.error('Ошибка загрузки резервных копий');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (backupId: string) => {
    setRestoring(backupId);
    try {
      const { data, error } = await supabase.rpc('restore_account_from_backup', {
        backup_id: backupId
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        fetchBackups(); // Обновляем список
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error restoring account:', error);
      toast.error('Ошибка при восстановлении аккаунта');
    } finally {
      setRestoring(null);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Система отката операций</CardTitle>
          <CardDescription>Загрузка...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Undo2 className="h-5 w-5" />
          Система отката операций
        </CardTitle>
        <CardDescription>
          Управление резервными копиями и восстановление аккаунтов после неудачных операций объединения
        </CardDescription>
      </CardHeader>
      <CardContent>
        {backups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Нет доступных резервных копий
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата операции</TableHead>
                <TableHead>Тип операции</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Данные backup</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действие</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell>{formatDate(backup.created_at)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {backup.operation_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {backup.user_id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      Auth method: {backup.backup_data?.auth_method || 'N/A'}<br />
                      Telegram ID: {backup.backup_data?.telegram_id || 'null'}<br />
                      Email confirmed: {backup.backup_data?.email_confirmed ? 'Да' : 'Нет'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {backup.restored_at ? (
                      <Badge variant="outline">
                        Восстановлено {formatDate(backup.restored_at)}
                      </Badge>
                    ) : (
                      <Badge variant="default">
                        Доступно для восстановления
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!backup.restored_at && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestore(backup.id)}
                        disabled={restoring === backup.id}
                        className="flex items-center gap-1"
                      >
                        {restoring === backup.id ? (
                          'Восстанавливаем...'
                        ) : (
                          <>
                            <AlertTriangle className="h-3 w-3" />
                            Откатить
                          </>
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};