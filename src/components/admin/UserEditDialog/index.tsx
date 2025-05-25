
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { UserEditDialogProps, UserFormValues } from './types';
import { UserEditForm } from './UserEditForm';

export const UserEditDialog = ({ user, trigger, onSuccess }: UserEditDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Force dialog to be open when user prop is provided
  const isOpen = !!user;

  const handleSubmit = async (values: UserFormValues) => {
    try {
      setIsSubmitting(true);
      
      console.log("Submitting user edit for:", user?.id, "with values:", values);
      
      // Clean up values to prevent empty strings being saved as nulls
      const cleanedValues = Object.entries(values).reduce((acc, [key, value]) => {
        acc[key] = value === "" ? null : value;
        return acc;
      }, {} as Record<string, any>);
      
      // For admin editing, we need to bypass the telegram_edit_count check
      // This will be handled by the RLS policy, so no need to modify it here
      const { error } = await supabase
        .from('profiles')
        .update(cleanedValues)
        .eq('id', user!.id);

      if (error) {
        console.error("Error updating user:", error);
        toast({
          title: "Ошибка",
          description: `Не удалось обновить данные пользователя: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log("User updated successfully");
        toast({
          title: "Успех",
          description: "Данные пользователя обновлены",
        });
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error("Exception updating user:", err);
      toast({
        title: "Ошибка",
        description: "Произошла непредвиденная ошибка при обновлении пользователя",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    console.log("Closing user edit dialog");
    if (onSuccess) onSuccess(); // This will set editingUser to null
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Редактировать пользователя</DialogTitle>
          <DialogDescription>
            Внесите изменения в профиль пользователя и нажмите Сохранить
          </DialogDescription>
        </DialogHeader>
        <UserEditForm 
          user={user} 
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting} 
          onClose={handleClose} 
        />
      </DialogContent>
    </Dialog>
  );
};
