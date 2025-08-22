
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
import { useLanguage } from "@/hooks/useLanguage";
import { getProfileTranslations } from "@/utils/profileTranslations";

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
  const { language } = useLanguage();
  const t = getProfileTranslations(language);
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.profileIncomplete}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.profileIncompleteDesc}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t.cancel}
          </Button>
          <Button
            onClick={onGoToProfile}
            className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
          >
            {t.goToProfile}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ProfileWarningDialog;
