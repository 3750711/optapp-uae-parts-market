
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UserStatusChangeDialogProps {
  trigger: React.ReactNode;
  status: 'verified' | 'pending' | 'blocked';
  onConfirm: () => void;
}

export const UserStatusChangeDialog = ({
  trigger,
  status,
  onConfirm,
}: UserStatusChangeDialogProps) => {
  const [open, setOpen] = React.useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  const statusMessages = {
    verified: 'подтвердить',
    pending: 'установить статус "ожидает подтверждения"',
    blocked: 'заблокировать'
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Подтверждение изменения статуса</DialogTitle>
          <DialogDescription>
            Вы уверены, что хотите {statusMessages[status]} этого пользователя?
            {status !== 'blocked' && (
              <p className="mt-2">
                Пользователю будет отправлено уведомление в Telegram об изменении статуса.
              </p>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-4 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleConfirm}>
            Подтвердить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
