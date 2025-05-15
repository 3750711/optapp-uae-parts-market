
import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { ProfileType } from '@/components/profile/types';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  full_name: z.string().min(2, "Минимум 2 символа").optional(),
  company_name: z.string().optional(),
  phone: z.string().optional(),
  telegram: z.string()
    .optional()
    .refine((value) => {
      if (!value) return true;
      return /^@[^@]+$/.test(value);
    }, { message: "Telegram должен начинаться с @" }),
  opt_id: z.string().optional(),
  user_type: z.enum(["buyer", "seller", "admin"]),
  verification_status: z.enum(["verified", "pending", "blocked"]),
});

interface UserEditDialogProps {
  user: ProfileType;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export const UserEditDialog = ({ user, trigger, onSuccess }: UserEditDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: user.full_name || "",
      company_name: user.company_name || "",
      phone: user.phone || "",
      telegram: user.telegram || "",
      opt_id: user.opt_id || "",
      user_type: user.user_type,
      verification_status: user.verification_status,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
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
        .eq('id', user.id);

      if (error) {
        console.error("Error updating user:", error);
        toast({
          title: "Ошибка",
          description: `Не удалось обновить данные пользователя: ${error.message}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Успех",
          description: "Данные пользователя обновлены",
        });
        setOpen(false);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Редактировать пользователя</DialogTitle>
          <DialogDescription>
            Внесите изменения в профиль пользователя и нажмите Сохранить
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя и фамилия</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите имя" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название компании</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите название компании" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Телефон</FormLabel>
                  <FormControl>
                    <Input placeholder="+971 XX XXX XXXX" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telegram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telegram</FormLabel>
                  <FormControl>
                    <Input placeholder="@username" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="opt_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OPT ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите OPT ID" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="user_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип пользователя</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="buyer">Покупатель</SelectItem>
                      <SelectItem value="seller">Продавец</SelectItem>
                      <SelectItem value="admin">Администратор</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="verification_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Статус верификации</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите статус" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Ожидает</SelectItem>
                      <SelectItem value="verified">Подтвержден</SelectItem>
                      <SelectItem value="blocked">Заблокирован</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Сохранение...
                </>
              ) : (
                "Сохранить изменения"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
