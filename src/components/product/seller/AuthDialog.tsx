
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoToLogin?: () => void;
}

export const AuthDialog: React.FC<AuthDialogProps> = ({
  open,
  onOpenChange,
  onGoToLogin
}) => {
  const handleGoToLogin = () => {
    if (onGoToLogin) {
      onGoToLogin();
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Требуется авторизация</DialogTitle>
          <DialogDescription>
            Для связи с продавцом необходимо войти в аккаунт или зарегистрироваться.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-center">
          <Button onClick={handleGoToLogin} className="w-full sm:w-auto">
            Войти / Зарегистрироваться
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Отмена
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
