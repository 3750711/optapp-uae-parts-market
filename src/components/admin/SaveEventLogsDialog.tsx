
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface SaveEventLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logs: any[];
  onSuccess?: () => void;
}

const SaveEventLogsDialog = ({ open, onOpenChange, logs, onSuccess }: SaveEventLogsDialogProps) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ 
        title: "Ошибка", 
        description: "Название набора логов обязательно", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('saved_action_logs')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          logs: logs,
          log_count: logs.length,
          saved_by: profile?.id
        });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: `${logs.length} записей сохранено как "${name}"`,
      });
      
      setName('');
      setDescription('');
      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error saving logs:', error);
      toast({
        title: "Ошибка при сохранении логов",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Сохранить записи журнала</DialogTitle>
          <DialogDescription>
            Сохраните текущий список записей журнала ({logs.length} записей) для последующего использования
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Название</Label>
            <Input
              id="name"
              placeholder="Введите название набора логов"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Описание (опционально)</Label>
            <Textarea
              id="description"
              placeholder="Добавьте описание для этого набора логов"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveEventLogsDialog;
