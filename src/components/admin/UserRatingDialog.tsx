
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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { ProfileType } from '@/components/profile/types';

const formSchema = z.object({
  rating: z
    .string()
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0 && num <= 5;
      },
      { message: "Рейтинг должен быть от 0 до 5" }
    )
});

interface UserRatingDialogProps {
  user: ProfileType;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export const UserRatingDialog = ({ user, trigger, onSuccess }: UserRatingDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rating: user.rating?.toString() || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const rating = parseFloat(values.rating);
    
    const { error } = await supabase
      .from('profiles')
      .update({ rating })
      .eq('id', user.id);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить рейтинг пользователя",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успех",
        description: "Рейтинг пользователя обновлен",
      });
      setOpen(false);
      if (onSuccess) onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Изменить рейтинг пользователя</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Рейтинг (0-5)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="5" 
                      placeholder="Введите рейтинг" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Сохранить рейтинг
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
