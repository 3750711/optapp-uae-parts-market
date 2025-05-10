
import React from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProfileWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoToProfile: () => void;
}

const ProfileWarningDialog: React.FC<ProfileWarningDialogProps> = ({
  open,
  onOpenChange,
  onGoToProfile,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Профиль не заполнен</AlertDialogTitle>
          <AlertDialogDescription>
            Для совершения покупки необходимо указать ваш OPT ID или Telegram в профиле.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button
            onClick={onGoToProfile}
            className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
          >
            Перейти к профилю
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ProfileWarningDialog;
