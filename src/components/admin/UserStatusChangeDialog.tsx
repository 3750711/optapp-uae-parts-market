
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
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";

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
  const [showTelegramInfo, setShowTelegramInfo] = React.useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
    
    // Show Telegram info dialog if this is a status that should send notifications
    if (status !== 'blocked') {
      setShowTelegramInfo(true);
    }
  };

  const statusMessages = {
    verified: 'подтвердить',
    pending: 'установить статус "ожидает подтверждения"',
    blocked: 'заблокировать'
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение изменения статуса</DialogTitle>
            <DialogDescription>
              <p>
                Вы уверены, что хотите {statusMessages[status]} этого пользователя?
              </p>
              {status !== 'blocked' && (
                <p className="mt-2">
                  Пользователю будет отправлено уведомление в Telegram об изменении статуса, если указан корректный Telegram и пользователь уже начал диалог с ботом.
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
      
      {/* Additional dialog with Telegram information */}
      <AlertDialog open={showTelegramInfo} onOpenChange={setShowTelegramInfo}>
        <AlertDialogContent>
          <AlertDialogTitle>Важная информация о Telegram уведомлениях</AlertDialogTitle>
          <AlertDialogDescription>
            <p className="mt-2">
              Для получения Telegram уведомлений пользователь должен:
            </p>
            <ol className="list-decimal pl-5 mt-2 space-y-1">
              <li>Иметь корректный указанный Telegram-аккаунт в своем профиле</li>
              <li>Начать диалог с ботом отправив команду /start</li>
            </ol>
            <p className="mt-2 text-amber-600 font-medium">
              Уведомления не будут доставлены, если пользователь не выполнил эти условия.
            </p>
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogAction>Понятно</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
