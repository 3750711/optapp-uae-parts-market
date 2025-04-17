
import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProfileType } from "@/integrations/supabase/types";

interface ProfileActionsProps {
  profile: ProfileType;
  isLoading: boolean;
  onDeleteAccount: () => Promise<void>;
  onContactAdmin: () => void;
}

const ProfileActions: React.FC<ProfileActionsProps> = ({ 
  profile,
  isLoading,
  onDeleteAccount,
  onContactAdmin
}) => {
  return (
    <div className="mt-6 w-full space-y-4">
      <Button 
        onClick={onContactAdmin}
        className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
      >
        Связаться с администратором
      </Button>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full">
            Удалить аккаунт
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить аккаунт?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие удалит ваш аккаунт и все связанные данные навсегда. 
              Данное действие не может быть отменено.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteAccount}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProfileActions;
