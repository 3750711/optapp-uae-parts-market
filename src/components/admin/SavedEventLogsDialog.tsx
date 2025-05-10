
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trash } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SavedLog {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  log_count: number;
  logs: any[];
}

interface SavedEventLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectLogs?: (logs: any[]) => void;
}

const SavedEventLogsDialog = ({ open, onOpenChange, onSelectLogs }: SavedEventLogsDialogProps) => {
  const { toast } = useToast();
  const [savedLogs, setSavedLogs] = useState<SavedLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('saved_action_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedLogs(data || []);
    } catch (error: any) {
      console.error('Error fetching saved logs:', error);
      toast({
        title: "Ошибка загрузки",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSavedLogs();
    }
  }, [open]);

  const handleSelectLogs = (logs: any[]) => {
    if (onSelectLogs) {
      onSelectLogs(logs);
      onOpenChange(false);
    }
  };

  const handleDeleteSavedLog = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('saved_action_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSavedLogs(savedLogs.filter(log => log.id !== id));
      toast({
        title: "Удалено",
        description: "Набор логов успешно удален",
      });
    } catch (error: any) {
      console.error('Error deleting saved logs:', error);
      toast({
        title: "Ошибка при удалении",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Сохраненные журналы событий</DialogTitle>
          <DialogDescription>
            Выберите сохраненный набор записей журнала для загрузки
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[450px] pr-4">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Загрузка данных...
            </div>
          ) : savedLogs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              У вас пока нет сохраненных журналов событий
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Дата создания</TableHead>
                  <TableHead>Кол-во записей</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedLogs.map((log) => (
                  <TableRow 
                    key={log.id} 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSelectLogs(log.logs)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.name}</div>
                        {log.description && (
                          <div className="text-sm text-muted-foreground">{log.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm')}
                    </TableCell>
                    <TableCell>{log.log_count}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => handleDeleteSavedLog(log.id, e)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default SavedEventLogsDialog;
