
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { Download } from 'lucide-react';

const SaveEventLogsDialog = () => {
  const { isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAdmin) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Сохранить логи
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Сохранение логов событий</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Функция сохранения логов событий в разработке.
          </p>
          <Button onClick={() => setIsOpen(false)}>
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveEventLogsDialog;
