
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { UserEditDialogProps, UserFormValues } from './types';
import { UserEditForm } from './UserEditForm';

export const UserEditDialog = ({ user, trigger, onSuccess }: UserEditDialogProps) => {
  const { toast } = useToast();
  const { checkTokenValidity, forceRefreshSession, refreshProfile } = useAuth();
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [pendingValues, setPendingValues] = React.useState<UserFormValues | null>(null);

  if (!user) return null;

  const isOpen = !!user;
  const isConfirmationOpen = !!pendingValues;

  const proceedWithSubmit = async (values: UserFormValues) => {
    try {
      setIsSubmitting(true);
      
      console.log("Submitting user edit for:", user?.id, "with values:", values);
      
      // Check token validity before proceeding
      const isTokenValid = await checkTokenValidity();
      if (!isTokenValid) {
        console.log("Token is invalid, attempting to refresh...");
        const refreshSuccess = await forceRefreshSession();
        if (!refreshSuccess) {
          throw new Error("Authentication session expired. Please log in again.");
        }
      }
      
      const cleanedValues = Object.entries(values).reduce((acc, [key, value]) => {
        if (key === 'rating' && value) {
          acc[key] = parseFloat(value as string);
        } else {
          acc[key] = value === "" ? null : value;
        }
        return acc;
      }, {} as Record<string, any>);
      
      // Use secure RPC function for admin updates
      const { data, error } = await supabase.rpc('secure_update_profile', {
        p_user_id: user!.id,
        p_updates: cleanedValues
      });

      if (error) {
        console.error("Error updating user:", error);
        
        // Check if it's an authentication error and try to recover
        if (error.message?.includes('auth') || error.message?.includes('token') || error.message?.includes('session')) {
          console.log("Authentication error detected, attempting session refresh...");
          const refreshSuccess = await forceRefreshSession();
          if (refreshSuccess) {
            // Retry the operation after refreshing
            const { data: retryData, error: retryError } = await supabase.rpc('secure_update_profile', {
              p_user_id: user!.id,
              p_updates: cleanedValues
            });
            
            if (retryError) {
              throw retryError;
            }
            
            if (!retryData?.success) {
              throw new Error(retryData?.message || 'Failed to update profile after session refresh');
            }
          } else {
            throw new Error("Session refresh failed. Please log in again.");
          }
        } else {
          throw error;
        }
      } else if (!data?.success) {
        throw new Error(data?.message || 'Failed to update profile');
      }

      console.log("User updated successfully");
      
      // Force profile refresh in AuthContext if this is the current user
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (currentUser && user.id === currentUser.id && refreshProfile) {
        console.log('Refreshing current user profile after admin edit');
        await refreshProfile();
      }
      
      toast({
        title: "Успех",
        description: "Данные пользователя обновлены",
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Exception updating user:", err);
      
      const errorMessage = err.message?.includes('auth') || err.message?.includes('token') || err.message?.includes('session')
        ? "Ошибка аутентификации. Попробуйте обновить страницу и войти заново."
        : `Не удалось обновить данные пользователя: ${err.message}`;
        
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (values: UserFormValues) => {
    if (!user) return;

    const statusChanged = values.verification_status !== user.verification_status;
    const typeChanged = values.user_type !== user.user_type;

    if (statusChanged || typeChanged) {
        setPendingValues(values);
    } else {
        await proceedWithSubmit(values);
    }
  };

  const handleConfirmSubmit = async () => {
    if (pendingValues) {
        await proceedWithSubmit(pendingValues);
    }
    setPendingValues(null);
  };
  
  const handleCancelSubmit = () => {
    setPendingValues(null);
  };

  const handleClose = () => {
    console.log("Closing user edit dialog");
    if (onSuccess) onSuccess();
  };

  const formElement = (
    <UserEditForm 
      user={user} 
      onSubmit={handleSubmit} 
      isSubmitting={isSubmitting} 
      onClose={handleClose}
      isMobile={isMobile}
    />
  );

  const dialogComponent = isMobile ? (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent 
        side="bottom" 
        className="h-[95vh] flex flex-col p-0"
      >
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>Редактировать пользователя</SheetTitle>
          <SheetDescription>
            Внесите изменения в профиль пользователя и нажмите Сохранить
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {formElement}
        </div>
      </SheetContent>
    </Sheet>
  ) : (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать пользователя</DialogTitle>
          <DialogDescription>
            Внесите изменения в профиль пользователя и нажмите Сохранить
          </DialogDescription>
        </DialogHeader>
        {formElement}
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      {dialogComponent}
      <AlertDialog open={isConfirmationOpen} onOpenChange={(open) => !open && handleCancelSubmit()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите критические изменения</AlertDialogTitle>
            <AlertDialogDescription>
              Вы собираетесь изменить статус верификации или тип пользователя. Это может повлиять на права доступа. Вы уверены?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSubmit}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Сохранение...' : 'Подтвердить и сохранить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
